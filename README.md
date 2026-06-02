# Kanjify
Kanjify monorepo

## Development

```bash
./dev.sh
```

- Django API: http://localhost:8002
- Vite web server: http://localhost:3002

Stop both servers with `Ctrl-C`.
lsof -ti TCP:8002,3002 | xargs kill -9