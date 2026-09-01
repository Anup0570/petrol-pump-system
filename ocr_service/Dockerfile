FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create cache directory for model files and download them during build or copy them
ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
ENV HF_HUB_OFFLINE=1

COPY main.py .

EXPOSE 5000

CMD ["python", "main.py"]
