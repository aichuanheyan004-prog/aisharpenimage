FROM runpod/worker-comfyui:5.8.6-base

USER root
RUN mkdir -p /comfyui/models/upscale_models \
    && curl --fail --location --retry 3 \
      --output /comfyui/models/upscale_models/RealESRGAN_x4plus.pth \
      https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth \
    && test "$(stat -c%s /comfyui/models/upscale_models/RealESRGAN_x4plus.pth)" = "67040989" \
    && echo "4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1  /comfyui/models/upscale_models/RealESRGAN_x4plus.pth" | sha256sum --check --strict
