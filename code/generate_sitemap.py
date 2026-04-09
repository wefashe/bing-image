#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import os
from datetime import datetime

SITE_URL = "https://wefashe.github.io/bing-image"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
SITEMAP_PATH = os.path.join(BASE_DIR, 'docs/sitemap.xml')


def generate_sitemap():
    today = datetime.now().strftime("%Y-%m-%d")
    content = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <lastmod>{today}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>'''
    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"sitemap.xml generated, lastmod: {today}")


if __name__ == "__main__":
    generate_sitemap()
