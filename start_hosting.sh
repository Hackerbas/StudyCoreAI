#!/bin/bash
cd /home/not2more4u/StudyCoreAI/StudyCoreAI

# Start the Flask app in the background if it's not already running
if ! pgrep -f "python3 full.py" > /dev/null; then
    ./venv/bin/python full.py &
    sleep 3
fi

# Fetch the LocalTunnel password (IP address)
echo ""
echo "============================================="
echo "YOUR TUNNEL PASSWORD IS:"
curl -s https://loca.lt/mytunnelpassword
echo ""
echo "============================================="
echo "Starting tunnel... Click the link below and paste the password above when asked:"
npx --yes localtunnel --port 5000
