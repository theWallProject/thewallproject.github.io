import { spawn } from "node:child_process";
import net from "node:net";

// Dev helper: start the PHP built-in server that serves the donation wall
// image (src/dynamic/donations.php) on :8080 so `npm run dev` always shows the
// latest generated image. Detaches so it survives the npm script exiting.
const portInUse = () =>
  new Promise((resolve) => {
    const sock = net.connect(8080, "127.0.0.1", () => {
      sock.destroy();
      resolve(true);
    });
    sock.on("error", () => resolve(false));
  });

if (await portInUse()) {
  console.log("[donations] PHP server already running on http://localhost:8080");
} else {
  const child = spawn("php", ["-S", "127.0.0.1:8080", "router-dev.php"], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  console.log("[donations] Started PHP server on http://localhost:8080");
}
