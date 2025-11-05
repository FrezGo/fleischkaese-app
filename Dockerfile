# Verwende ein offizielles Python-Image als Basis.
# Wir nutzen die schlanke Version, um die Dateigröße zu minimieren.
FROM python:3.10-slim

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die Abhängigkeiten-Datei ins Arbeitsverzeichnis
COPY requirements.txt .

# Installiere die Python-Abhängigkeiten
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere alle restlichen Dateien deines Projekts in den Container
COPY . .

# Gib an, auf welchem Port deine App lauscht
EXPOSE 5000

# Starte die Anwendung mit Gunicorn.
# Gunicorn ist ein robuster Webserver, der besser für Produktion geeignet ist als der eingebaute Flask-Server.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]