from fastapi import FastAPI, HTTPException, Request, Form, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
from typing import Optional, Dict, Any, List
import asyncio

from llm_connectors import LLMConnector
from prompt_cleaner import cleanPrompt
from config import Config
from document_processor import DocumentProcessor

app = FastAPI(title="LLM Relay Agent", version="0.0.1")
templates = Jinja2Templates(directory="templates")

# Initialize LLM connector (no mock provider by default)
llm_connector = LLMConnector(include_mock=Config.INCLUDE_MOCK_PROVIDER)

# Initialize document processor
doc_processor = DocumentProcessor()

class PromptRequest(BaseModel):
    prompt: str
    llm_provider: str
    model: Optional[str] = None
    file_contents: Optional[List[str]] = None

class PromptResponse(BaseModel):
    response: str
    provider: str
    model: str
    cleaned_prompt: str
    document_info: Optional[Dict[str, Any]] = None

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the main web interface"""
    available_llms = llm_connector.get_available_providers()
    return templates.TemplateResponse("index.html", {
        "request": request, 
        "llms": available_llms
    })

@app.post("/api/upload", response_model=Dict[str, Any])
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload and process multiple document files"""
    try:
        if len(files) > 5:  # Limit to 5 files
            raise HTTPException(status_code=400, detail="Maximum 5 files allowed")
        
        results = []
        for file in files:
            if not doc_processor.is_supported_file(file.filename):
                results.append({
                    "success": False,
                    "error": f"Unsupported file type: {file.filename}",
                    "filename": file.filename
                })
                continue
            
            result = await doc_processor.process_file(file)
            result["filename"] = file.filename
            results.append(result)
        
        # Check if any files were processed successfully
        successful_files = [r for r in results if r.get("success", False)]
        failed_files = [r for r in results if not r.get("success", False)]
        
        return {
            "success": len(successful_files) > 0,
            "results": results,
            "summary": {
                "total_files": len(files),
                "successful": len(successful_files),
                "failed": len(failed_files)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=PromptResponse)
async def chat(request: PromptRequest):
    """Process chat request and relay to selected LLM"""
    try:
        # Combine prompt with file contents if provided
        full_prompt = request.prompt
        document_info = None
        
        if request.file_contents and len(request.file_contents) > 0:
            documents_section = "\n\nDocument Contents:\n"
            for i, content in enumerate(request.file_contents, 1):
                documents_section += f"\n--- Document {i} ---\n{content}\n"
            full_prompt = f"{request.prompt}{documents_section}"
            document_info = {"has_documents": True, "document_count": len(request.file_contents)}
        
        # Clean the full prompt (including document content)
        cleaned_prompt = cleanPrompt(full_prompt)
        
        # Get response from selected LLM
        response = await llm_connector.generate_response(
            prompt=cleaned_prompt,
            provider=request.llm_provider,
            model=request.model
        )
        
        return PromptResponse(
            response=response["content"],
            provider=request.llm_provider,
            model=response["model"],
            cleaned_prompt=cleaned_prompt,
            document_info=document_info
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_class=HTMLResponse)
async def chat_form(
    request: Request,
    prompt: str = Form(...),
    llm_provider: str = Form(...),
    model: str = Form(None)
):
    """Handle form-based chat requests"""
    try:
        cleaned_prompt = cleanPrompt(prompt)
        response = await llm_connector.generate_response(
            prompt=cleaned_prompt,
            provider=llm_provider,
            model=model
        )
        
        available_llms = llm_connector.get_available_providers()
        return templates.TemplateResponse("index.html", {
            "request": request,
            "llms": available_llms,
            "user_prompt": prompt,
            "cleaned_prompt": cleaned_prompt,
            "llm_response": response["content"],
            "selected_provider": llm_provider,
            "used_model": response["model"]
        })
    
    except Exception as e:
        available_llms = llm_connector.get_available_providers()
        return templates.TemplateResponse("index.html", {
            "request": request,
            "llms": available_llms,
            "error": str(e),
            "user_prompt": prompt,
            "selected_provider": llm_provider
        })

@app.get("/api/providers")
async def get_providers():
    """Get available LLM providers and their models"""
    return llm_connector.get_available_providers()

if __name__ == "__main__":
    import uvicorn
    # Pass app as import string for reload to work
    uvicorn.run("main:app", host=Config.HOST, port=Config.PORT, reload=Config.DEBUG)
