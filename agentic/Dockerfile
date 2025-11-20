FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt /app/requirements.txt

RUN python -m pip install --upgrade pip setuptools wheel

RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app
EXPOSE 8000
CMD ["bash", "./start.sh"]
