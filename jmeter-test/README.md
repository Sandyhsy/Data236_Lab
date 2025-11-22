## Quick JMeter guide

**Before you start**
- Docker working? Check with `docker --version` and `docker run --rm hello-world`.
- Backend up? curl http://localhost:4000

**Run the test**
```bash
docker run --rm --network data236_lab1_default \
  --add-host host.docker.internal:host-gateway \
  -v "$PWD":/test -w /test justb4/jmeter \
  -n -t airbnb_backend_test.jmx \
  -JVUSERS=20 -JRAMP_SECONDS=10 \
  -l jmeter_run_smoke.jtl -j jmeter_run_smoke.log
```
- `VUSERS` (default 500) = how many users to spin up.  
- `RAMP_SECONDS` (default 60) = how long to ramp them in. Skip the `-J` flags for the full load.

**View a report**
```bash
rm -rf jmeter_report
docker run --rm -v "$PWD":/test -w /test justb4/jmeter \
  -g jmeter_run_smoke.jtl -o jmeter_report
open jmeter_report/index.html
```

**Optional: install JMeter locally**
```bash
cd jmeter-test
curl -L -o apache-jmeter-5.6.3.tgz https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.3.tgz
tar -xzf apache-jmeter-5.6.3.tgz && mv apache-jmeter-5.6.3 jmeter && rm apache-jmeter-5.6.3.tgz
```
