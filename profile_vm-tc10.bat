@echo off
curl http://localhost:8080/input:tap-vm-video
timeout /t 2 > nul
curl http://localhost:8080/input:tap-vm-vmp-continue
timeout /t 5 > nul
curl http://localhost:8080/trace:start
timeout /t 5 > nul
curl http://localhost:8080/input:tap-vm-vmp-rec
timeout /t 50 > nul
curl http://localhost:8080/trace:stop
