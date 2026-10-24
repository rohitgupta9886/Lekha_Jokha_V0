@echo off
where node > "%~dp0..\where_node.txt" 2>&1
echo DONE >> "%~dp0..\where_node.txt"
