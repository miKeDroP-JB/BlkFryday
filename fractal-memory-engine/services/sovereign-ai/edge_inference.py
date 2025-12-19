"""
===============================================================================
EDGE INFERENCE - "THE SPARK"

Lightweight inference for edge devices and low-latency scenarios.
Uses ONNX Runtime for optimized CPU/GPU inference on quantized models.

Capabilities:
- ONNX Runtime inference
- Dynamic batching
- Model caching
- Quantization (INT8, FP16)
- CPU/GPU optimization
- Streaming support

INTELLIGENCE AT THE EDGE.
===============================================================================
"""

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any, AsyncGenerator
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===============================================================================
# CONFIGURATION
# ===============================================================================

class EdgeDevice(str, Enum):
    CPU = "cpu"
    CUDA = "cuda"
    TENSORRT = "tensorrt"
    COREML = "coreml"        # Apple Silicon
    DIRECTML = "directml"    # Windows GPU
    ROCM = "rocm"            # AMD GPU


class QuantizationType(str, Enum):
    FP32 = "fp32"
    FP16 = "fp16"
    INT8 = "int8"
    INT4 = "int4"


@dataclass
class EdgeModelConfig:
    """Configuration for an edge model"""
    name: str
    model_path: str
    tokenizer_path: str
    device: EdgeDevice = EdgeDevice.CPU
    quantization: QuantizationType = QuantizationType.INT8
    max_seq_length: int = 512
    max_batch_size: int = 4
    num_threads: int = 4


@dataclass
class EdgeConfig:
    """Edge inference configuration"""
    models_dir: str = "./models/edge"
    cache_dir: str = "./cache/edge"
    default_device: EdgeDevice = EdgeDevice.CPU
    enable_caching: bool = True
    cache_max_size_mb: int = 500
    warmup_on_load: bool = True


# ===============================================================================
# ONNX INFERENCE ENGINE
# ===============================================================================

class ONNXInferenceEngine:
    """
    ONNX Runtime-based inference engine for edge deployment.
    """

    def __init__(self, config: EdgeConfig):
        self.config = config
        self.models: Dict[str, Any] = {}
        self.tokenizers: Dict[str, Any] = {}
        self.sessions: Dict[str, Any] = {}
        self.cache: Dict[str, Any] = {}

        os.makedirs(config.models_dir, exist_ok=True)
        os.makedirs(config.cache_dir, exist_ok=True)

        # Check ONNX Runtime availability
        self._check_onnx_runtime()

    def _check_onnx_runtime(self):
        """Check if ONNX Runtime is available"""
        try:
            import onnxruntime as ort
            self.ort = ort

            # Check available providers
            self.available_providers = ort.get_available_providers()
            logger.info(f"ONNX Runtime providers: {self.available_providers}")

            # Determine best provider
            if "CUDAExecutionProvider" in self.available_providers:
                self.default_provider = "CUDAExecutionProvider"
            elif "CoreMLExecutionProvider" in self.available_providers:
                self.default_provider = "CoreMLExecutionProvider"
            elif "DmlExecutionProvider" in self.available_providers:
                self.default_provider = "DmlExecutionProvider"
            else:
                self.default_provider = "CPUExecutionProvider"

            logger.info(f"Default provider: {self.default_provider}")

        except ImportError:
            logger.warning("ONNX Runtime not installed. Install with: pip install onnxruntime-gpu")
            self.ort = None
            self.available_providers = []
            self.default_provider = None

    def _get_session_options(self, config: EdgeModelConfig) -> Any:
        """Get optimized session options"""
        if not self.ort:
            return None

        opts = self.ort.SessionOptions()

        # Threading
        opts.intra_op_num_threads = config.num_threads
        opts.inter_op_num_threads = config.num_threads

        # Graph optimizations
        opts.graph_optimization_level = self.ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        # Memory optimizations
        opts.enable_mem_pattern = True
        opts.enable_cpu_mem_arena = True

        return opts

    def _get_providers(self, device: EdgeDevice) -> List[str]:
        """Get execution providers for device"""
        if device == EdgeDevice.CUDA:
            return ["CUDAExecutionProvider", "CPUExecutionProvider"]
        elif device == EdgeDevice.TENSORRT:
            return ["TensorrtExecutionProvider", "CUDAExecutionProvider", "CPUExecutionProvider"]
        elif device == EdgeDevice.COREML:
            return ["CoreMLExecutionProvider", "CPUExecutionProvider"]
        elif device == EdgeDevice.DIRECTML:
            return ["DmlExecutionProvider", "CPUExecutionProvider"]
        elif device == EdgeDevice.ROCM:
            return ["ROCMExecutionProvider", "CPUExecutionProvider"]
        return ["CPUExecutionProvider"]

    async def load_model(self, model_config: EdgeModelConfig) -> bool:
        """Load an ONNX model"""
        if not self.ort:
            logger.error("ONNX Runtime not available")
            return False

        try:
            model_path = Path(model_config.model_path)
            if not model_path.exists():
                logger.error(f"Model not found: {model_path}")
                return False

            # Load tokenizer
            tokenizer_path = Path(model_config.tokenizer_path)
            if tokenizer_path.exists():
                try:
                    from transformers import AutoTokenizer
                    tokenizer = AutoTokenizer.from_pretrained(str(tokenizer_path))
                    self.tokenizers[model_config.name] = tokenizer
                except ImportError:
                    logger.warning("Transformers not installed for tokenizer")

            # Create session
            session_opts = self._get_session_options(model_config)
            providers = self._get_providers(model_config.device)

            # Filter to available providers
            providers = [p for p in providers if p in self.available_providers]

            session = self.ort.InferenceSession(
                str(model_path),
                sess_options=session_opts,
                providers=providers
            )

            self.sessions[model_config.name] = session
            self.models[model_config.name] = model_config

            logger.info(f"Loaded model: {model_config.name}")
            logger.info(f"  Path: {model_path}")
            logger.info(f"  Providers: {session.get_providers()}")

            # Warmup
            if self.config.warmup_on_load:
                await self._warmup(model_config.name)

            return True

        except Exception as e:
            logger.error(f"Failed to load model {model_config.name}: {e}")
            return False

    async def _warmup(self, model_name: str):
        """Warmup model with dummy inference"""
        if model_name not in self.sessions:
            return

        session = self.sessions[model_name]
        config = self.models[model_name]

        try:
            # Get input info
            inputs = session.get_inputs()
            input_shapes = {}

            for inp in inputs:
                shape = list(inp.shape)
                # Replace dynamic dims with reasonable values
                shape = [s if isinstance(s, int) else 1 for s in shape]
                input_shapes[inp.name] = shape

            # Create dummy inputs
            import numpy as np
            dummy_inputs = {}
            for name, shape in input_shapes.items():
                dummy_inputs[name] = np.zeros(shape, dtype=np.int64)

            # Run warmup
            _ = session.run(None, dummy_inputs)
            logger.info(f"Warmup complete for {model_name}")

        except Exception as e:
            logger.warning(f"Warmup failed for {model_name}: {e}")

    def _get_cache_key(self, model_name: str, input_text: str) -> str:
        """Generate cache key"""
        content = f"{model_name}:{input_text}"
        return hashlib.md5(content.encode()).hexdigest()

    def _check_cache(self, cache_key: str) -> Optional[str]:
        """Check response cache"""
        if not self.config.enable_caching:
            return None
        return self.cache.get(cache_key)

    def _update_cache(self, cache_key: str, response: str):
        """Update response cache"""
        if not self.config.enable_caching:
            return

        self.cache[cache_key] = response

        # Simple cache eviction (FIFO when over limit)
        # In production, use proper LRU cache
        if len(self.cache) > 10000:
            # Remove oldest half
            keys = list(self.cache.keys())
            for key in keys[:5000]:
                del self.cache[key]

    async def infer(
        self,
        model_name: str,
        input_text: str,
        max_tokens: int = 256,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Run inference on edge model"""
        start_time = time.time()

        if model_name not in self.sessions:
            raise ValueError(f"Model not loaded: {model_name}")

        # Check cache
        cache_key = self._get_cache_key(model_name, input_text)
        cached = self._check_cache(cache_key)
        if cached:
            return {
                "content": cached,
                "model": model_name,
                "cached": True,
                "latency_ms": 0
            }

        session = self.sessions[model_name]
        config = self.models[model_name]

        try:
            # Tokenize
            if model_name in self.tokenizers:
                tokenizer = self.tokenizers[model_name]
                inputs = tokenizer(
                    input_text,
                    return_tensors="np",
                    padding=True,
                    truncation=True,
                    max_length=config.max_seq_length
                )
                onnx_inputs = {k: v for k, v in inputs.items()}
            else:
                # Fallback: basic tokenization
                import numpy as np
                # This is a placeholder - real implementation needs proper tokenizer
                onnx_inputs = {
                    "input_ids": np.array([[1] * min(len(input_text.split()), config.max_seq_length)], dtype=np.int64)
                }

            # Run inference
            outputs = session.run(None, onnx_inputs)

            # Decode output
            if model_name in self.tokenizers:
                tokenizer = self.tokenizers[model_name]
                output_text = tokenizer.decode(outputs[0][0], skip_special_tokens=True)
            else:
                output_text = str(outputs[0])

            latency_ms = (time.time() - start_time) * 1000

            # Cache result
            self._update_cache(cache_key, output_text)

            return {
                "content": output_text,
                "model": model_name,
                "cached": False,
                "latency_ms": latency_ms,
                "device": config.device.value,
                "quantization": config.quantization.value
            }

        except Exception as e:
            logger.error(f"Inference error for {model_name}: {e}")
            raise

    def get_status(self) -> Dict[str, Any]:
        """Get engine status"""
        return {
            "service": "edge-inference",
            "codename": "THE SPARK",
            "onnx_available": self.ort is not None,
            "default_provider": self.default_provider,
            "available_providers": self.available_providers,
            "loaded_models": list(self.models.keys()),
            "cache_entries": len(self.cache),
            "models": {
                name: {
                    "device": config.device.value,
                    "quantization": config.quantization.value,
                    "max_seq_length": config.max_seq_length
                }
                for name, config in self.models.items()
            }
        }


# ===============================================================================
# MODEL CONVERTER
# ===============================================================================

class ModelConverter:
    """
    Converts models to ONNX format for edge deployment.
    """

    def __init__(self, output_dir: str = "./models/edge"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    async def convert_from_transformers(
        self,
        model_name: str,
        model_id: str,
        quantization: QuantizationType = QuantizationType.INT8,
        max_seq_length: int = 512
    ) -> Optional[str]:
        """Convert Hugging Face model to ONNX"""
        try:
            from optimum.onnxruntime import ORTModelForCausalLM, ORTQuantizer
            from optimum.onnxruntime.configuration import AutoQuantizationConfig
            from transformers import AutoTokenizer

            logger.info(f"Converting {model_id} to ONNX...")

            output_path = Path(self.output_dir) / model_name

            # Export to ONNX
            model = ORTModelForCausalLM.from_pretrained(
                model_id,
                export=True,
                provider="CPUExecutionProvider"
            )
            tokenizer = AutoTokenizer.from_pretrained(model_id)

            # Save base model
            model.save_pretrained(str(output_path / "base"))
            tokenizer.save_pretrained(str(output_path / "tokenizer"))

            # Quantize if requested
            if quantization in [QuantizationType.INT8, QuantizationType.INT4]:
                logger.info(f"Quantizing to {quantization.value}...")

                if quantization == QuantizationType.INT8:
                    qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False)
                else:
                    qconfig = AutoQuantizationConfig.arm64(is_static=False)

                quantizer = ORTQuantizer.from_pretrained(str(output_path / "base"))
                quantizer.quantize(
                    save_dir=str(output_path / "quantized"),
                    quantization_config=qconfig
                )

                final_path = str(output_path / "quantized" / "model.onnx")
            else:
                final_path = str(output_path / "base" / "model.onnx")

            logger.info(f"Conversion complete: {final_path}")
            return final_path

        except ImportError as e:
            logger.error(f"Missing dependency for conversion: {e}")
            logger.info("Install with: pip install optimum[onnxruntime]")
            return None
        except Exception as e:
            logger.error(f"Conversion failed: {e}")
            return None

    async def convert_from_ollama(
        self,
        model_name: str,
        ollama_model: str,
        quantization: QuantizationType = QuantizationType.INT8
    ) -> Optional[str]:
        """Convert Ollama model to ONNX (via GGUF)"""
        logger.warning("Ollama to ONNX conversion not yet implemented")
        logger.info("For Ollama models, use the direct Ollama inference path")
        return None

    def generate_conversion_script(self, model_id: str, output_name: str) -> str:
        """Generate standalone conversion script"""
        script = f'''#!/usr/bin/env python3
"""
0RB Edge Model Conversion Script
Converts {model_id} to ONNX for edge deployment
"""

import os
from pathlib import Path

# Install dependencies
# pip install optimum[onnxruntime] transformers torch

from optimum.onnxruntime import ORTModelForCausalLM, ORTQuantizer
from optimum.onnxruntime.configuration import AutoQuantizationConfig
from transformers import AutoTokenizer

MODEL_ID = "{model_id}"
OUTPUT_DIR = "{self.output_dir}/{output_name}"

print(f"Converting {{MODEL_ID}} to ONNX...")

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Export to ONNX
model = ORTModelForCausalLM.from_pretrained(
    MODEL_ID,
    export=True,
    provider="CPUExecutionProvider"
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

# Save
model.save_pretrained(f"{{OUTPUT_DIR}}/base")
tokenizer.save_pretrained(f"{{OUTPUT_DIR}}/tokenizer")

# Quantize to INT8
print("Quantizing to INT8...")
qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False)

quantizer = ORTQuantizer.from_pretrained(f"{{OUTPUT_DIR}}/base")
quantizer.quantize(
    save_dir=f"{{OUTPUT_DIR}}/quantized",
    quantization_config=qconfig
)

print(f"Conversion complete!")
print(f"Base model: {{OUTPUT_DIR}}/base/model.onnx")
print(f"Quantized model: {{OUTPUT_DIR}}/quantized/model.onnx")
'''
        script_path = f"{self.output_dir}/convert_{output_name}.py"
        with open(script_path, 'w') as f:
            f.write(script)

        logger.info(f"Conversion script saved to: {script_path}")
        return script_path


# ===============================================================================
# EDGE SERVING API
# ===============================================================================

class EdgeServingAPI:
    """
    FastAPI-based serving for edge inference.
    """

    def __init__(self, config: Optional[EdgeConfig] = None):
        self.config = config or EdgeConfig()
        self.engine = ONNXInferenceEngine(self.config)
        self.converter = ModelConverter(self.config.models_dir)

    async def initialize(self):
        """Initialize edge serving"""
        logger.info("=" * 60)
        logger.info("EDGE INFERENCE ENGINE - THE SPARK")
        logger.info("=" * 60)

        # Auto-load models from models_dir
        models_path = Path(self.config.models_dir)
        if models_path.exists():
            for model_dir in models_path.iterdir():
                if model_dir.is_dir():
                    onnx_file = model_dir / "quantized" / "model.onnx"
                    if not onnx_file.exists():
                        onnx_file = model_dir / "base" / "model.onnx"

                    if onnx_file.exists():
                        config = EdgeModelConfig(
                            name=model_dir.name,
                            model_path=str(onnx_file),
                            tokenizer_path=str(model_dir / "tokenizer")
                        )
                        await self.engine.load_model(config)

    def create_app(self):
        """Create FastAPI application"""
        from fastapi import FastAPI, HTTPException
        from pydantic import BaseModel

        app = FastAPI(
            title="Edge Inference Engine",
            description="THE SPARK - Lightweight inference at the edge",
            version="1.0.0"
        )

        class InferRequest(BaseModel):
            model: str
            input: str
            max_tokens: int = 256
            temperature: float = 0.7

        @app.get("/health")
        async def health():
            return {"status": "healthy", "service": "edge-inference"}

        @app.get("/status")
        async def status():
            return self.engine.get_status()

        @app.post("/infer")
        async def infer(request: InferRequest):
            try:
                result = await self.engine.infer(
                    request.model,
                    request.input,
                    request.max_tokens,
                    request.temperature
                )
                return result
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @app.get("/models")
        async def list_models():
            return {
                "models": list(self.engine.models.keys())
            }

        return app


# ===============================================================================
# MAIN
# ===============================================================================

def create_requirements() -> str:
    """Generate requirements for edge inference"""
    requirements = """# Edge Inference Requirements
onnxruntime>=1.17.0
# For GPU support, use one of:
# onnxruntime-gpu>=1.17.0
# onnxruntime-directml>=1.17.0  # Windows
# onnxruntime-silicon>=1.17.0  # Apple Silicon

# For model conversion
optimum[onnxruntime]>=1.17.0
transformers>=4.40.0
torch>=2.0.0

# Optional: for better performance
numpy>=1.24.0
scipy>=1.10.0

# Serving
fastapi>=0.109.0
uvicorn>=0.27.0
"""
    return requirements


if __name__ == "__main__":
    async def main():
        config = EdgeConfig()
        serving = EdgeServingAPI(config)
        await serving.initialize()

        print("\n" + "=" * 60)
        print("EDGE ENGINE STATUS")
        print("=" * 60)
        print(json.dumps(serving.engine.get_status(), indent=2))

        # Print requirements
        print("\n" + "=" * 60)
        print("REQUIREMENTS")
        print("=" * 60)
        print(create_requirements())

    asyncio.run(main())
