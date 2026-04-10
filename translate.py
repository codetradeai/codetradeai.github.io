import re

with open("index.html", "r") as f:
    content = f.read()

# I will write a simple translation mapping for you, but it's massive.
# Let's save a copy of index.html first.
with open("index-en.html", "w") as f:
    f.write(content.replace("lang=\"pt-BR\"", "lang=\"en-US\""))
