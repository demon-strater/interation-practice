import logging
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = "0.0.0.0"
PORT = 8004
ROOT = Path(__file__).resolve().parent
LOG_FILE = ROOT / ".local-server.runtime.log"


class ReusableHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


class QuietRequestHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:
        logging.info("%s - %s", self.address_string(), format % args)


def configure_logging() -> None:
    logging.basicConfig(
        filename=LOG_FILE,
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )


def main() -> None:
    configure_logging()
    handler = partial(QuietRequestHandler, directory=str(ROOT))
    server = ReusableHTTPServer((HOST, PORT), handler)
    logging.info("Starting local server on http://127.0.0.1:%s", PORT)
    try:
        server.serve_forever()
    except Exception:
        logging.exception("Local server crashed")
        raise


if __name__ == "__main__":
    main()
