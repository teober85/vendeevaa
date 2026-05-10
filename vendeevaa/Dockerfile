FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir websockets
COPY server.py regie.html overlay.html regie.css overlay.css ./
EXPOSE 8765 8766
CMD ["python", "-u", "server.py"]
