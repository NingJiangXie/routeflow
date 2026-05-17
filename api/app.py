from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import openai
import os
import json
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Path Planning AI Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_DIR = Path(__file__).parent / "config"
CONFIG_DIR.mkdir(exist_ok=True)
CONFIG_FILE = CONFIG_DIR / "api_config.json"

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    api_key: Optional[str] = None
    model: Optional[str] = "gpt-3.5-turbo"
    provider: Optional[str] = "openai"

class ApiConfig(BaseModel):
    provider: str
    api_key: str
    model: str

class CodeRequest(BaseModel):
    algorithm: str
    language: Optional[str] = "python"

def load_config() -> Dict[str, Any]:
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
    return {}

def save_config(config: Dict[str, Any]):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        logger.info("Config saved successfully")
    except Exception as e:
        logger.error(f"Failed to save config: {e}")

def call_openai(messages: List[Dict[str, str]], api_key: str, model: str = "gpt-3.5-turbo") -> str:
    try:
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail=f"API调用失败: {str(e)}")

def call_deepseek(messages: List[Dict[str, str]], api_key: str, model: str = "deepseek-v4") -> str:
    try:
        client = openai.OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com/v1"
        )
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"DeepSeek API error: {e}")
        raise HTTPException(status_code=500, detail=f"API调用失败: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    logger.info(f"Received chat request with {len(request.messages)} messages")
    
    messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]
    
    if request.provider == "openai":
        response = call_openai(messages_dict, request.api_key, request.model)
    elif request.provider == "deepseek":
        response = call_deepseek(messages_dict, request.api_key, request.model)
    else:
        raise HTTPException(status_code=400, detail="不支持的API提供商")
    
    return {"response": response}

@app.post("/api/test-api")
async def test_api(config: ApiConfig):
    logger.info(f"Testing API connection for {config.provider}")
    
    test_messages = [
        {"role": "user", "content": "Hello, test connection!"}
    ]
    
    try:
        if config.provider == "openai":
            response = call_openai(test_messages, config.api_key, config.model)
        elif config.provider == "deepseek":
            response = call_deepseek(test_messages, config.api_key, config.model)
        else:
            raise HTTPException(status_code=400, detail="不支持的API提供商")
        
        return {"success": True, "message": "连接成功", "response": response[:50] + "..."}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/api/save-config")
async def save_api_config(config: ApiConfig):
    existing_config = load_config()
    existing_config[config.provider] = {
        "api_key": config.api_key,
        "model": config.model
    }
    save_config(existing_config)
    return {"success": True, "message": "配置已保存"}

@app.get("/api/get-config")
async def get_api_config():
    config = load_config()
    return {"config": config}

@app.post("/api/generate-code")
async def generate_code(request: CodeRequest):
    logger.info(f"Generating code for {request.algorithm} in {request.language}")
    
    algorithms_info = {
        "dstar": {
            "name": "D* Lite",
            "description": "一种高效的动态路径规划算法，适合环境变化时的重新规划"
        },
        "rrt": {
            "name": "RRT*",
            "description": "基于快速扩展随机树的优化算法，能够找到最优路径"
        },
        "aco": {
            "name": "蚁群算法",
            "description": "基于蚂蚁觅食行为的启发式优化算法"
        },
        "hcfa": {
            "name": "混合协作融合算法",
            "description": "结合多种算法优势的混合路径规划算法"
        }
    }
    
    algo_key = request.algorithm.lower()
    if algo_key not in algorithms_info:
        raise HTTPException(status_code=400, detail="不支持的算法")
    
    algo_info = algorithms_info[algo_key]
    
    prompt = f"""请提供{algo_info['name']}算法的完整{request.language}实现代码。
    
要求：
1. 代码完整可运行
2. 包含详细注释
3. 包含算法解释
4. 返回格式为JSON，包含code和explanation字段

算法描述：{algo_info['description']}
"""
    
    config = load_config()
    if "openai" in config:
        api_key = config["openai"]["api_key"]
        model = config["openai"]["model"]
        response = call_openai([{"role": "user", "content": prompt}], api_key, model)
    else:
        raise HTTPException(status_code=400, detail="未配置API密钥")
    
    try:
        result = json.loads(response)
        return result
    except:
        return {"code": response, "explanation": "代码生成成功"}

@app.get("/api/algorithms")
async def get_algorithms():
    return {
        "algorithms": [
            {"id": "dstar", "name": "D* Lite", "type": "动态规划"},
            {"id": "rrt", "name": "RRT*", "type": "采样算法"},
            {"id": "aco", "name": "蚁群算法", "type": "启发式算法"},
            {"id": "hcfa", "name": "HCFA", "type": "混合算法"}
        ]
    }

@app.post("/api/optimize-code")
async def optimize_code(request: dict):
    logger.info(f"Optimizing code for algorithm: {request.get('algorithm')}")
    
    algo_map = {"1": "dstar", "2": "rrt", "3": "aco", "4": "hcfa"}
    goal_map = {
        "performance": "性能优化",
        "memory": "内存优化",
        "readability": "代码可读性优化",
        "completeness": "功能完整性优化"
    }
    
    algo = algo_map.get(str(request.get("algorithm", "1")), "dstar")
    goal = goal_map.get(request.get("goal", "performance"), "性能优化")
    requirements = request.get("requirements", "")
    
    prompt = f"""请优化{algo}算法代码，目标：{goal}。
    {f'额外要求：{requirements}' if requirements else ''}
    
    请提供：
    1. 优化建议（suggestions字段）
    2. 优化后的完整Python代码（optimized_code字段）
    3. 优化效果说明（explanation字段）
    
    请以JSON格式返回，包含optimized_code、suggestions和explanation字段。"""
    
    config = load_config()
    if not config:
        raise HTTPException(status_code=400, detail="未配置API密钥")
    
    provider = list(config.keys())[0] if config else "openai"
    api_key = config[provider]["api_key"]
    model = config[provider]["model"]
    
    try:
        if provider == "openai":
            response = call_openai([{"role": "user", "content": prompt}], api_key, model)
        else:
            response = call_deepseek([{"role": "user", "content": prompt}], api_key, model)
        
        try:
            result = json.loads(response)
            return result
        except:
            return {
                "optimized_code": response,
                "suggestions": "代码优化完成",
                "explanation": "已生成优化后的代码"
            }
    except Exception as e:
        logger.error(f"Optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/git/execute")
async def git_execute(request: dict):
    logger.info(f"Git command: {request.get('command')}")
    
    import subprocess
    
    command = request.get("command", "")
    repo_path = request.get("repo_path", ".")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "命令执行超时"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/compare-algorithms")
async def compare_algorithms():
    comparison = {
        "dstar": {
            "name": "D* Lite",
            "优点": ["动态环境适应性强", "重规划效率高", "最优路径保证"],
            "缺点": ["内存占用较大", "初始化较慢"],
            "适用场景": ["动态障碍物环境", "实时路径调整"]
        },
        "rrt": {
            "name": "RRT*",
            "优点": ["处理高维空间", "概率完备", "渐近最优"],
            "缺点": ["收敛速度较慢", "路径不一定最优"],
            "适用场景": ["复杂环境", "非完整约束"]
        },
        "aco": {
            "name": "蚁群算法",
            "优点": ["全局搜索能力强", "鲁棒性好", "分布式计算"],
            "缺点": ["收敛速度慢", "容易陷入局部最优"],
            "适用场景": ["多目标优化", "大规模问题"]
        },
        "hcfa": {
            "name": "HCFA",
            "优点": ["综合性能优", "适应性强", "兼顾全局与局部"],
            "缺点": ["实现复杂", "参数调节困难"],
            "适用场景": ["复杂动态环境"]
        }
    }
    return comparison

@app.get("/")
async def root():
    return {"message": "Path Planning AI Assistant API is running", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)