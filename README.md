# FairgraphRank

## Run via Docker

Execute the following command at the root directory

```
docker-compose up
```

## Run manually

At server folder, run

```
pip install -r requirements.txt
gunicorn server:app -c gunicorn.conf.py
```

And at gui folder, run

```
npm install
npm start
```
