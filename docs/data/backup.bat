chcp 65001
@echo off

..\..\tool\sqlite3 images.db .dump > images.sql
echo images.db 备份 images.sql 成功!
pause