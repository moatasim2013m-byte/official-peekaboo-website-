#!/usr/bin/env python3
"""Simple concurrent load test for the Node health endpoint.

Usage:
  python tests/performance/load_test_healthz.py --url http://127.0.0.1:8080/healthz --concurrency 1000 --requests 10000
"""

import argparse
import concurrent.futures
import json
import time
import urllib.request
from statistics import mean


def percentile(sorted_values, p):
    if not sorted_values:
        return 0.0
    index = int((p / 100.0) * len(sorted_values)) - 1
    index = max(0, min(index, len(sorted_values) - 1))
    return sorted_values[index]


def run_test(url: str, concurrency: int, requests: int, timeout: float):
    def request_once(_):
        start = time.perf_counter()
        try:
            with urllib.request.urlopen(url, timeout=timeout) as response:
                ok = response.getcode() == 200
        except Exception:
            ok = False
        return time.perf_counter() - start, ok

    wall_start = time.perf_counter()
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        for result in executor.map(request_once, range(requests), chunksize=20):
            results.append(result)

    wall_time = time.perf_counter() - wall_start
    latencies = sorted(lat for lat, _ in results)
    success_count = sum(1 for _, ok in results if ok)

    return {
        "url": url,
        "concurrency": concurrency,
        "requests": requests,
        "success": success_count,
        "failed": requests - success_count,
        "success_rate": success_count / requests if requests else 0,
        "duration_seconds": wall_time,
        "throughput_rps": requests / wall_time if wall_time else 0,
        "latency_seconds": {
            "avg": mean(latencies) if latencies else 0,
            "p50": percentile(latencies, 50),
            "p95": percentile(latencies, 95),
            "p99": percentile(latencies, 99),
            "max": max(latencies) if latencies else 0,
        },
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8080/healthz")
    parser.add_argument("--concurrency", type=int, default=1000)
    parser.add_argument("--requests", type=int, default=10000)
    parser.add_argument("--timeout", type=float, default=10.0)
    args = parser.parse_args()

    result = run_test(args.url, args.concurrency, args.requests, args.timeout)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
