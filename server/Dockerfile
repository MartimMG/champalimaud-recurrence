FROM python:3.11-slim

WORKDIR /app

COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

COPY server /app/server
COPY coxnet_model_bundle.pkl /app/coxnet_model_bundle.pkl

ENV SURVSHAP_BUNDLE=/app/coxnet_model_bundle.pkl

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
