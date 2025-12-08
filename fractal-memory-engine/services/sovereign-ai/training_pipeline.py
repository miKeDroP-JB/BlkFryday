"""
===============================================================================
TRAINING PIPELINE - "THE FORGE"

Fine-tuning and training pipeline for creating sovereign 0RB models.
Supports LoRA, QLoRA, and full fine-tuning with automatic optimization.

Capabilities:
- Data preparation & augmentation
- LoRA/QLoRA fine-tuning
- Model merging & export
- Quantization (GGUF, AWQ, GPTQ)
- Evaluation & benchmarking

FORGE YOUR OWN INTELLIGENCE.
===============================================================================
"""

import asyncio
import json
import logging
import os
import shutil
import subprocess
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any
import yaml

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===============================================================================
# CONFIGURATION
# ===============================================================================

class TrainingMethod(str, Enum):
    LORA = "lora"               # Low-Rank Adaptation
    QLORA = "qlora"             # Quantized LoRA (4-bit)
    FULL = "full"               # Full fine-tuning (expensive)
    DORA = "dora"               # Weight-Decomposed LoRA


class BaseModel(str, Enum):
    LLAMA3_8B = "meta-llama/Meta-Llama-3-8B-Instruct"
    LLAMA3_70B = "meta-llama/Meta-Llama-3-70B-Instruct"
    MISTRAL_7B = "mistralai/Mistral-7B-Instruct-v0.2"
    MIXTRAL_8X7B = "mistralai/Mixtral-8x7B-Instruct-v0.1"
    PHI3_MINI = "microsoft/Phi-3-mini-4k-instruct"
    QWEN2_7B = "Qwen/Qwen2-7B-Instruct"
    QWEN2_72B = "Qwen/Qwen2-72B-Instruct"


class QuantizationFormat(str, Enum):
    GGUF_Q4_K_M = "q4_k_m"      # Good quality, small size
    GGUF_Q5_K_M = "q5_k_m"      # Better quality
    GGUF_Q8_0 = "q8_0"          # High quality
    AWQ = "awq"                 # Activation-aware quantization
    GPTQ = "gptq"               # Post-training quantization


@dataclass
class TrainingConfig:
    """Training configuration"""
    # Model settings
    base_model: str = BaseModel.LLAMA3_8B.value
    method: TrainingMethod = TrainingMethod.QLORA
    output_name: str = "orb-sovereign"

    # LoRA settings
    lora_r: int = 64                    # LoRA rank
    lora_alpha: int = 128               # LoRA alpha
    lora_dropout: float = 0.05
    target_modules: List[str] = field(default_factory=lambda: [
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ])

    # Training hyperparameters
    num_epochs: int = 3
    batch_size: int = 4
    gradient_accumulation_steps: int = 4
    learning_rate: float = 2e-4
    warmup_ratio: float = 0.03
    weight_decay: float = 0.01
    max_seq_length: int = 4096

    # Hardware settings
    use_4bit: bool = True               # QLoRA 4-bit
    use_flash_attention: bool = True
    bf16: bool = True
    gradient_checkpointing: bool = True

    # Data settings
    train_split: float = 0.9
    shuffle_seed: int = 42

    # Output settings
    output_dir: str = "./models"
    save_steps: int = 100
    logging_steps: int = 10


@dataclass
class DataConfig:
    """Data preparation configuration"""
    input_path: str = "./knowledge_store/extracted"
    output_path: str = "./training_data"
    format: str = "chatml"

    # Augmentation
    augment: bool = True
    paraphrase: bool = False
    translate_langs: List[str] = field(default_factory=list)

    # Filtering
    min_instruction_length: int = 10
    min_output_length: int = 20
    max_output_length: int = 4096
    remove_duplicates: bool = True

    # Quality filtering
    gold_only: bool = False
    min_confidence: float = 0.5


# ===============================================================================
# DATA PREPARATION
# ===============================================================================

class DataPreparator:
    """Prepares and augments training data"""

    def __init__(self, config: DataConfig):
        self.config = config
        os.makedirs(config.output_path, exist_ok=True)

    def load_extracted_data(self) -> List[Dict]:
        """Load extracted knowledge data"""
        all_data = []
        input_path = Path(self.config.input_path)

        for json_file in input_path.glob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)

                if isinstance(data, list):
                    all_data.extend(data)
                else:
                    all_data.append(data)

            except Exception as e:
                logger.warning(f"Error loading {json_file}: {e}")

        logger.info(f"Loaded {len(all_data)} entries from extracted data")
        return all_data

    def filter_data(self, data: List[Dict]) -> List[Dict]:
        """Apply quality filters to data"""
        filtered = []

        for entry in data:
            # Get fields based on format
            instruction = entry.get("instruction", "")
            input_text = entry.get("input", "")
            output = entry.get("output", "")
            metadata = entry.get("metadata", {})

            # For ChatML format
            if "conversations" in entry:
                for conv in entry["conversations"]:
                    if conv.get("role") == "assistant":
                        output = conv.get("content", "")

            # Length filters
            if len(instruction) < self.config.min_instruction_length:
                continue
            if len(output) < self.config.min_output_length:
                continue
            if len(output) > self.config.max_output_length:
                output = output[:self.config.max_output_length]
                entry["output"] = output

            # Quality filter
            confidence = metadata.get("confidence", 1.0)
            if confidence < self.config.min_confidence:
                continue

            # Gold only filter
            if self.config.gold_only and metadata.get("quality") != "gold":
                continue

            filtered.append(entry)

        logger.info(f"Filtered to {len(filtered)} entries (from {len(data)})")
        return filtered

    def deduplicate(self, data: List[Dict]) -> List[Dict]:
        """Remove duplicate entries"""
        if not self.config.remove_duplicates:
            return data

        seen = set()
        unique = []

        for entry in data:
            # Create dedup key
            key = f"{entry.get('instruction', '')}|{entry.get('input', '')}|{entry.get('output', '')}"
            key_hash = hash(key)

            if key_hash not in seen:
                seen.add(key_hash)
                unique.append(entry)

        logger.info(f"Deduplicated to {len(unique)} entries (removed {len(data) - len(unique)})")
        return unique

    def convert_format(self, data: List[Dict], target_format: str) -> List[Dict]:
        """Convert data to target format"""
        converted = []

        for entry in data:
            if target_format == "chatml":
                # Convert to ChatML
                conversations = []

                instruction = entry.get("instruction", "")
                if instruction:
                    conversations.append({
                        "role": "system",
                        "content": instruction
                    })

                conversations.append({
                    "role": "user",
                    "content": entry.get("input", "")
                })

                conversations.append({
                    "role": "assistant",
                    "content": entry.get("output", "")
                })

                converted.append({"conversations": conversations})

            elif target_format == "alpaca":
                # Already Alpaca format
                converted.append({
                    "instruction": entry.get("instruction", "You are a helpful AI assistant."),
                    "input": entry.get("input", ""),
                    "output": entry.get("output", "")
                })

            elif target_format == "openai":
                # OpenAI fine-tuning format
                messages = []

                instruction = entry.get("instruction", "")
                if instruction:
                    messages.append({
                        "role": "system",
                        "content": instruction
                    })

                messages.append({
                    "role": "user",
                    "content": entry.get("input", "")
                })

                messages.append({
                    "role": "assistant",
                    "content": entry.get("output", "")
                })

                converted.append({"messages": messages})

        return converted

    def augment_data(self, data: List[Dict]) -> List[Dict]:
        """Apply data augmentation"""
        if not self.config.augment:
            return data

        augmented = data.copy()

        # Add system prompt variations
        system_prompts = [
            "You are 0RB, a sovereign AI assistant with full knowledge retention.",
            "You are a helpful and knowledgeable AI assistant named 0RB.",
            "As 0RB, provide accurate and helpful responses.",
            "You are 0RB System, an AI with persistent memory and sovereign intelligence."
        ]

        for entry in data[:len(data)//4]:  # Augment 25%
            if "conversations" in entry:
                for prompt in system_prompts[1:]:  # Skip first, vary others
                    new_entry = {"conversations": []}
                    for conv in entry["conversations"]:
                        if conv.get("role") == "system":
                            new_entry["conversations"].append({
                                "role": "system",
                                "content": prompt
                            })
                        else:
                            new_entry["conversations"].append(conv.copy())
                    augmented.append(new_entry)

        logger.info(f"Augmented to {len(augmented)} entries")
        return augmented

    def prepare(self) -> Dict[str, str]:
        """Full data preparation pipeline"""
        logger.info("=" * 60)
        logger.info("DATA PREPARATION PIPELINE")
        logger.info("=" * 60)

        # Load
        data = self.load_extracted_data()

        # Filter
        data = self.filter_data(data)

        # Deduplicate
        data = self.deduplicate(data)

        # Convert format
        data = self.convert_format(data, self.config.format)

        # Augment
        data = self.augment_data(data)

        # Split train/val
        split_idx = int(len(data) * 0.9)
        train_data = data[:split_idx]
        val_data = data[split_idx:]

        # Save
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        train_path = f"{self.config.output_path}/train_{timestamp}.json"
        val_path = f"{self.config.output_path}/val_{timestamp}.json"

        with open(train_path, 'w') as f:
            json.dump(train_data, f, indent=2)

        with open(val_path, 'w') as f:
            json.dump(val_data, f, indent=2)

        logger.info(f"Saved {len(train_data)} training examples to {train_path}")
        logger.info(f"Saved {len(val_data)} validation examples to {val_path}")

        return {
            "train": train_path,
            "val": val_path,
            "total": len(data),
            "train_count": len(train_data),
            "val_count": len(val_data)
        }


# ===============================================================================
# TRAINING PIPELINE
# ===============================================================================

class TrainingPipeline:
    """Main training pipeline for fine-tuning"""

    def __init__(self, config: TrainingConfig):
        self.config = config
        os.makedirs(config.output_dir, exist_ok=True)

    def generate_training_script(self, train_data: str, val_data: str) -> str:
        """Generate training script for unsloth/transformers"""
        script = f'''#!/usr/bin/env python3
"""
0RB SOVEREIGN MODEL TRAINING SCRIPT
Generated: {datetime.now().isoformat()}
Base Model: {self.config.base_model}
Method: {self.config.method.value}
"""

import torch
from datasets import load_dataset
from transformers import TrainingArguments
from trl import SFTTrainer

# Check for unsloth (faster training)
try:
    from unsloth import FastLanguageModel
    USE_UNSLOTH = True
    print("Using Unsloth for 2x faster training")
except ImportError:
    from transformers import AutoModelForCausalLM, AutoTokenizer
    USE_UNSLOTH = False
    print("Using standard transformers")

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

MODEL_NAME = "{self.config.base_model}"
OUTPUT_DIR = "{self.config.output_dir}/{self.config.output_name}"
TRAIN_DATA = "{train_data}"
VAL_DATA = "{val_data}"

# LoRA Configuration
LORA_R = {self.config.lora_r}
LORA_ALPHA = {self.config.lora_alpha}
LORA_DROPOUT = {self.config.lora_dropout}
TARGET_MODULES = {self.config.target_modules}

# Training Configuration
NUM_EPOCHS = {self.config.num_epochs}
BATCH_SIZE = {self.config.batch_size}
GRADIENT_ACCUMULATION = {self.config.gradient_accumulation_steps}
LEARNING_RATE = {self.config.learning_rate}
MAX_SEQ_LENGTH = {self.config.max_seq_length}

# ═══════════════════════════════════════════════════════════════════════════
# LOAD MODEL
# ═══════════════════════════════════════════════════════════════════════════

print("Loading model...")

if USE_UNSLOTH:
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=None,  # Auto-detect
        load_in_4bit={str(self.config.use_4bit).lower()},
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r=LORA_R,
        target_modules=TARGET_MODULES,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )
else:
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import BitsAndBytesConfig

    bnb_config = BitsAndBytesConfig(
        load_in_4bit={str(self.config.use_4bit).lower()},
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    tokenizer.pad_token = tokenizer.eos_token

    model = prepare_model_for_kbit_training(model)

    lora_config = LoraConfig(
        r=LORA_R,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        target_modules=TARGET_MODULES,
        bias="none",
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, lora_config)

# ═══════════════════════════════════════════════════════════════════════════
# LOAD DATA
# ═══════════════════════════════════════════════════════════════════════════

print("Loading training data...")

dataset = load_dataset("json", data_files={{"train": TRAIN_DATA, "validation": VAL_DATA}})

def format_chat(example):
    """Format data for training"""
    if "conversations" in example:
        text = ""
        for msg in example["conversations"]:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                text += f"<|system|>\\n{{content}}</s>\\n"
            elif role == "user":
                text += f"<|user|>\\n{{content}}</s>\\n"
            elif role == "assistant":
                text += f"<|assistant|>\\n{{content}}</s>\\n"
        return {{"text": text}}
    else:
        # Alpaca format
        instruction = example.get("instruction", "")
        input_text = example.get("input", "")
        output = example.get("output", "")

        if input_text:
            text = f"<|system|>\\n{{instruction}}</s>\\n<|user|>\\n{{input_text}}</s>\\n<|assistant|>\\n{{output}}</s>"
        else:
            text = f"<|user|>\\n{{instruction}}</s>\\n<|assistant|>\\n{{output}}</s>"

        return {{"text": text}}

dataset = dataset.map(format_chat)

# ═══════════════════════════════════════════════════════════════════════════
# TRAINING
# ═══════════════════════════════════════════════════════════════════════════

print("Starting training...")

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=NUM_EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    gradient_accumulation_steps=GRADIENT_ACCUMULATION,
    learning_rate=LEARNING_RATE,
    warmup_ratio={self.config.warmup_ratio},
    weight_decay={self.config.weight_decay},
    logging_steps={self.config.logging_steps},
    save_steps={self.config.save_steps},
    save_total_limit=3,
    bf16={str(self.config.bf16).lower()},
    gradient_checkpointing={str(self.config.gradient_checkpointing).lower()},
    optim="adamw_8bit",
    lr_scheduler_type="cosine",
    report_to="none",
)

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset["train"],
    eval_dataset=dataset["validation"],
    dataset_text_field="text",
    max_seq_length=MAX_SEQ_LENGTH,
    args=training_args,
)

trainer.train()

# ═══════════════════════════════════════════════════════════════════════════
# SAVE MODEL
# ═══════════════════════════════════════════════════════════════════════════

print("Saving model...")

model.save_pretrained(f"{{OUTPUT_DIR}}/adapter")
tokenizer.save_pretrained(f"{{OUTPUT_DIR}}/adapter")

# Merge and save full model
if USE_UNSLOTH:
    model.save_pretrained_merged(
        f"{{OUTPUT_DIR}}/merged",
        tokenizer,
        save_method="merged_16bit",
    )
else:
    from peft import PeftModel
    merged_model = model.merge_and_unload()
    merged_model.save_pretrained(f"{{OUTPUT_DIR}}/merged")
    tokenizer.save_pretrained(f"{{OUTPUT_DIR}}/merged")

print("=" * 60)
print("TRAINING COMPLETE!")
print(f"Adapter saved to: {{OUTPUT_DIR}}/adapter")
print(f"Merged model saved to: {{OUTPUT_DIR}}/merged")
print("=" * 60)
'''

        # Save script
        script_path = f"{self.config.output_dir}/train_{self.config.output_name}.py"
        with open(script_path, 'w') as f:
            f.write(script)

        logger.info(f"Training script saved to: {script_path}")
        return script_path

    def generate_quantization_script(self) -> str:
        """Generate quantization script for GGUF export"""
        script = f'''#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# 0RB SOVEREIGN MODEL QUANTIZATION SCRIPT
# Converts trained model to GGUF for Ollama deployment
# ═══════════════════════════════════════════════════════════════════════════

MODEL_DIR="{self.config.output_dir}/{self.config.output_name}/merged"
OUTPUT_DIR="{self.config.output_dir}/{self.config.output_name}/gguf"
MODEL_NAME="{self.config.output_name}"

mkdir -p $OUTPUT_DIR

echo "═══════════════════════════════════════════════════════════════════════════"
echo "QUANTIZING: $MODEL_NAME"
echo "═══════════════════════════════════════════════════════════════════════════"

# Check for llama.cpp
if ! command -v python3 &> /dev/null; then
    echo "Python3 not found!"
    exit 1
fi

# Install llama-cpp-python if needed
pip install llama-cpp-python[server] --quiet

# Clone llama.cpp if not present
if [ ! -d "llama.cpp" ]; then
    git clone https://github.com/ggerganov/llama.cpp.git
    cd llama.cpp && make -j && cd ..
fi

# Convert to GGUF
echo "[*] Converting to GGUF format..."
python3 llama.cpp/convert_hf_to_gguf.py $MODEL_DIR --outfile $OUTPUT_DIR/$MODEL_NAME-f16.gguf

# Quantize to different formats
echo "[*] Quantizing to Q4_K_M..."
./llama.cpp/llama-quantize $OUTPUT_DIR/$MODEL_NAME-f16.gguf $OUTPUT_DIR/$MODEL_NAME-q4_k_m.gguf q4_k_m

echo "[*] Quantizing to Q5_K_M..."
./llama.cpp/llama-quantize $OUTPUT_DIR/$MODEL_NAME-f16.gguf $OUTPUT_DIR/$MODEL_NAME-q5_k_m.gguf q5_k_m

echo "[*] Quantizing to Q8_0..."
./llama.cpp/llama-quantize $OUTPUT_DIR/$MODEL_NAME-f16.gguf $OUTPUT_DIR/$MODEL_NAME-q8_0.gguf q8_0

# Create Ollama Modelfile
echo "[*] Creating Ollama Modelfile..."
cat > $OUTPUT_DIR/Modelfile << 'EOF'
FROM ./{self.config.output_name}-q4_k_m.gguf

TEMPLATE """<|system|>
{{{{ .System }}}}</s>
<|user|>
{{{{ .Prompt }}}}</s>
<|assistant|>
"""

PARAMETER stop "<|user|>"
PARAMETER stop "</s>"
PARAMETER temperature 0.7
PARAMETER top_p 0.9

SYSTEM """You are 0RB, a sovereign AI assistant with persistent memory and full knowledge retention. You were trained on interactions, decisions, and learnings from the Fractal Memory Engine. Provide helpful, accurate, and contextually aware responses."""
EOF

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "QUANTIZATION COMPLETE!"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "Models saved to: $OUTPUT_DIR"
echo ""
echo "To deploy to Ollama:"
echo "  cd $OUTPUT_DIR"
echo "  ollama create {self.config.output_name} -f Modelfile"
echo ""
echo "Then use:"
echo "  ollama run {self.config.output_name}"
echo ""
'''

        script_path = f"{self.config.output_dir}/quantize_{self.config.output_name}.sh"
        with open(script_path, 'w') as f:
            f.write(script)
        os.chmod(script_path, 0o755)

        logger.info(f"Quantization script saved to: {script_path}")
        return script_path

    def generate_config_yaml(self, train_data: str, val_data: str) -> str:
        """Generate YAML config for Axolotl training"""
        config = {
            "base_model": self.config.base_model,
            "model_type": "LlamaForCausalLM",
            "tokenizer_type": "LlamaTokenizer",
            "load_in_4bit": self.config.use_4bit,
            "load_in_8bit": False,

            "datasets": [
                {
                    "path": train_data,
                    "type": "sharegpt" if self.config.method == TrainingMethod.QLORA else "alpaca"
                }
            ],

            "dataset_prepared_path": f"{self.config.output_dir}/prepared",
            "output_dir": f"{self.config.output_dir}/{self.config.output_name}",

            "adapter": "qlora" if self.config.method == TrainingMethod.QLORA else "lora",
            "lora_r": self.config.lora_r,
            "lora_alpha": self.config.lora_alpha,
            "lora_dropout": self.config.lora_dropout,
            "lora_target_modules": self.config.target_modules,

            "sequence_len": self.config.max_seq_length,
            "sample_packing": True,
            "pad_to_sequence_len": True,

            "gradient_accumulation_steps": self.config.gradient_accumulation_steps,
            "micro_batch_size": self.config.batch_size,
            "num_epochs": self.config.num_epochs,
            "learning_rate": self.config.learning_rate,
            "optimizer": "adamw_bnb_8bit",
            "lr_scheduler": "cosine",
            "warmup_ratio": self.config.warmup_ratio,

            "bf16": self.config.bf16,
            "flash_attention": self.config.use_flash_attention,
            "gradient_checkpointing": self.config.gradient_checkpointing,

            "logging_steps": self.config.logging_steps,
            "save_steps": self.config.save_steps,
            "eval_steps": self.config.save_steps,
            "save_total_limit": 3,

            "wandb_project": "orb-sovereign",
            "wandb_run_id": f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        }

        config_path = f"{self.config.output_dir}/{self.config.output_name}_config.yaml"
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)

        logger.info(f"Axolotl config saved to: {config_path}")
        return config_path

    def get_requirements(self) -> List[str]:
        """Get required packages for training"""
        return [
            "torch>=2.0.0",
            "transformers>=4.40.0",
            "datasets>=2.18.0",
            "peft>=0.10.0",
            "trl>=0.8.0",
            "bitsandbytes>=0.43.0",
            "accelerate>=0.28.0",
            "scipy",
            "sentencepiece",
            "protobuf",
            "einops",
            "flash-attn>=2.5.0",  # Optional but recommended
            "unsloth[colab-new]",  # Optional for faster training
            "axolotl>=0.4.0",  # Alternative trainer
        ]


# ===============================================================================
# FULL PIPELINE
# ===============================================================================

class SovereignTrainingPipeline:
    """Complete sovereign model training pipeline"""

    def __init__(
        self,
        training_config: Optional[TrainingConfig] = None,
        data_config: Optional[DataConfig] = None
    ):
        self.training_config = training_config or TrainingConfig()
        self.data_config = data_config or DataConfig()

        self.data_preparator = DataPreparator(self.data_config)
        self.training_pipeline = TrainingPipeline(self.training_config)

    def prepare(self) -> Dict[str, Any]:
        """Prepare data and generate training scripts"""
        logger.info("=" * 70)
        logger.info("0RB SOVEREIGN TRAINING PIPELINE")
        logger.info("=" * 70)

        # Prepare data
        data_info = self.data_preparator.prepare()

        # Generate training script
        train_script = self.training_pipeline.generate_training_script(
            data_info["train"],
            data_info["val"]
        )

        # Generate Axolotl config
        axolotl_config = self.training_pipeline.generate_config_yaml(
            data_info["train"],
            data_info["val"]
        )

        # Generate quantization script
        quant_script = self.training_pipeline.generate_quantization_script()

        # Generate requirements
        requirements = self.training_pipeline.get_requirements()
        req_path = f"{self.training_config.output_dir}/requirements.txt"
        with open(req_path, 'w') as f:
            f.write("\n".join(requirements))

        return {
            "data": data_info,
            "train_script": train_script,
            "axolotl_config": axolotl_config,
            "quantization_script": quant_script,
            "requirements": req_path,
            "instructions": self._get_instructions(train_script, axolotl_config, quant_script)
        }

    def _get_instructions(self, train_script: str, axolotl_config: str, quant_script: str) -> str:
        """Get human-readable instructions"""
        return f"""
═══════════════════════════════════════════════════════════════════════════════
0RB SOVEREIGN MODEL TRAINING - INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

OPTION 1: Quick Training (Unsloth/TRL)
─────────────────────────────────────────
pip install -r {self.training_config.output_dir}/requirements.txt
python {train_script}


OPTION 2: Advanced Training (Axolotl)
─────────────────────────────────────────
pip install axolotl[flash-attn,deepspeed]
accelerate launch -m axolotl.cli.train {axolotl_config}


POST-TRAINING: Quantization & Deployment
─────────────────────────────────────────
{quant_script}


DEPLOY TO OLLAMA:
─────────────────────────────────────────
cd {self.training_config.output_dir}/{self.training_config.output_name}/gguf
ollama create {self.training_config.output_name} -f Modelfile
ollama run {self.training_config.output_name}


VERIFY IN SOVEREIGN AI ENGINE:
─────────────────────────────────────────
# Update MODEL_REGISTRY in inference.py to use orb-sovereign
# The system will automatically route to your sovereign model!

═══════════════════════════════════════════════════════════════════════════════
"""


# ===============================================================================
# CLI Interface
# ===============================================================================

async def main():
    import argparse

    parser = argparse.ArgumentParser(description="0RB Sovereign Model Training Pipeline")
    parser.add_argument("--base-model", default="meta-llama/Meta-Llama-3-8B-Instruct")
    parser.add_argument("--method", choices=["lora", "qlora", "full"], default="qlora")
    parser.add_argument("--output-name", default="orb-sovereign")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--lora-r", type=int, default=64)
    parser.add_argument("--input-data", default="./knowledge_store/extracted")
    parser.add_argument("--output-dir", default="./models")

    args = parser.parse_args()

    training_config = TrainingConfig(
        base_model=args.base_model,
        method=TrainingMethod(args.method),
        output_name=args.output_name,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        lora_r=args.lora_r,
        output_dir=args.output_dir
    )

    data_config = DataConfig(
        input_path=args.input_data
    )

    pipeline = SovereignTrainingPipeline(training_config, data_config)
    result = pipeline.prepare()

    print(result["instructions"])


if __name__ == "__main__":
    asyncio.run(main())
