chcp 65001
@echo off

rem 导出特定表 .dump [mytabl%]，也可以连接数据库后使用 .output backup.sql 或者 .dump [mytabl%] 进行备份，使用 .read backup.sql 还原
..\..\tool\sqlite3 images.db .dump > images.sql
rem 连接数据库后，还可以使用 .backup backup.db 进行备份数据库文件，使用 .restore backup.db 进行还原

echo images.db 备份 images.sql 成功!
pause