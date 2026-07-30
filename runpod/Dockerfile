# syntax=docker/dockerfile:1.7
FROM runpod/worker-comfyui:5.8.6-base-cuda12.8.1

USER root
ARG TORCH_VERSION=2.7.1
ARG TORCHVISION_VERSION=0.22.1
ARG TORCHAUDIO_VERSION=2.7.1

# The upstream image tag uses a CUDA 12.8 base but can contain a newer CUDA
# PyTorch wheel. Pin cu128 explicitly so RunPod hosts with driver 12.8 pass the
# worker's GPU preflight check.
RUN python -m pip install --no-cache-dir --force-reinstall \
      "torch==${TORCH_VERSION}+cu128" \
      "torchvision==${TORCHVISION_VERSION}+cu128" \
      "torchaudio==${TORCHAUDIO_VERSION}+cu128" \
      --index-url https://download.pytorch.org/whl/cu128 \
    && python -c "import torch; assert torch.__version__.startswith('${TORCH_VERSION}'); assert torch.version.cuda == '12.8', torch.version.cuda"

RUN mkdir -p /comfyui/models/upscale_models
ADD --checksum=sha256:4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1 \
    https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth \
    /comfyui/models/upscale_models/RealESRGAN_x4plus.pth
ADD --checksum=sha256:49fafd45f8fd7aa8d31ab2a22d14d91b536c34494a5cfe31eb5d89c2fa266abb \
    https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth \
    /comfyui/models/upscale_models/RealESRGAN_x2plus.pth
RUN python -c "from pathlib import Path; assert Path('/comfyui/models/upscale_models/RealESRGAN_x4plus.pth').stat().st_size == 67040989; assert Path('/comfyui/models/upscale_models/RealESRGAN_x2plus.pth').stat().st_size == 67061725"
