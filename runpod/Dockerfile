# syntax=docker/dockerfile:1.7
FROM runpod/worker-comfyui:5.8.6-base-cuda12.8.1

USER root
RUN mkdir -p /comfyui/models/upscale_models
ADD --checksum=sha256:4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1 \
    https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth \
    /comfyui/models/upscale_models/RealESRGAN_x4plus.pth
RUN python -c "from pathlib import Path; assert Path('/comfyui/models/upscale_models/RealESRGAN_x4plus.pth').stat().st_size == 67040989"
