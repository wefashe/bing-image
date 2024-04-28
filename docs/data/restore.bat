chcp 65001
@echo off

..\..\tool\sqlite3 images.db < images.sql
echo images.sql 还原 images.db 成功!
pause