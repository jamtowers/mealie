#!/bin/bash
cd /home/jtowers/Repos/mealie/angular
found=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  pnpm exec ng test --no-watch > /tmp/flake-run-$i.log 2>&1
  status=$?
  if [ $status -ne 0 ]; then
    echo "RUN $i: FAILURE (exit $status) -> /tmp/flake-run-$i.log"
    found=1
    break
  else
    echo "RUN $i: clean"
  fi
done
if [ $found -eq 0 ]; then
  echo "No flake captured in 10 runs"
fi
