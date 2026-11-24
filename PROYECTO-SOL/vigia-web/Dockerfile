FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY vigia ./vigia
ENV VIGIA_DB=/datos/vigia.db PYTHONUNBUFFERED=1
VOLUME /datos
EXPOSE 8080
HEALTHCHECK --interval=60s --timeout=5s CMD python -c "import urllib.request,os;urllib.request.urlopen('http://127.0.0.1:'+os.getenv('VIGIA_PUERTO','8080')+'/salud',timeout=4)"
CMD ["python", "-m", "vigia", "servir"]
