# brev-cli

CLI client for [Brev](https://github.com/matteo-genovese/brev) — URL shortener.

```bash
pip install brev-cli

brev login user@email.com password --server http://localhost:8000
brev create https://example.com          # random slug
brev create https://example.com --slug go # custom slug
brev list                                # your links
brev stats <slug>                        # analytics
brev delete <slug>                       # remove
brev whoami                              # current user
brev logout                              # clear credentials
```

Zero dependencies — pure Python stdlib.