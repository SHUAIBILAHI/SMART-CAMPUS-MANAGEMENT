#!/bin/bash
cd /workspaces/SMART-CAMPUS-MANAGEMENT

docker start campus-mysql 2>/dev/null || docker run --name campus-mysql -e MYSQL_ROOT_PASSWORD=CampusRoot123 -e MYSQL_DATABASE=smart_campus -p 3306:3306 -d mysql:8.0

echo "Waiting for MySQL..."
for i in {1..60}; do
  if docker exec campus-mysql mysqladmin ping -uroot -pCampusRoot123 --silent 2>/dev/null; then
    break
  fi
  sleep 2
done

nohup mvn spring-boot:run > /tmp/smart-campus.log 2>&1 &
echo "SMART CAMPUS STARTING..."
