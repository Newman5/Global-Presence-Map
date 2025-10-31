// scripts/export-globe.ts
import fs from "fs";
import path from "path";

// Path to your meeting data
const dataPath = path.join(process.cwd(), "src", "data", "sample-meeting.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const titleSafe = data.title?.replace(/\s+/g, "-") ?? "meeting";
const filename = `${titleSafe}-${data.date}.html`;

// --- HTML template ---
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${data.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html,body { margin:0; height:100%; background:black; }
    #globe { width:100vw; height:100vh; overflow:hidden; }
  </style>
  <script src="https://unpkg.com/three"></script>
  <script src="https://unpkg.com/globe.gl"></script>
</head>
<body>
  <div id="globe"></div>
  <script>
    const meeting = ${JSON.stringify(data)};

    const points = meeting.participants.map(p => ({
      lat: p.lat,
      lng: p.lng,
      label: p.name + ' (' + p.city + ')',
      color: 'orange'
    }));

    const arcs = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        arcs.push({
          startLat: points[i].lat,
          startLng: points[i].lng,
          endLat: points[j].lat,
          endLng: points[j].lng,
          color: ['#ffaa00', '#ff6600']
        });
      }
    }

    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .pointsData(points)
      .pointColor('color')
      .pointLabel('label')
      .pointAltitude(0.3)
      .arcsData(arcs)
      .arcColor('color')
      .arcAltitude(0.2)
      .arcDashLength(0.5)
      .arcDashGap(0.02)
      .arcDashAnimateTime(3000);

    globe(document.getElementById('globe'));
  </script>
</body>
</html>
`;

const outputDir = path.join(process.cwd(), "exports");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const outPath = path.join(outputDir, filename);
fs.writeFileSync(outPath, html);

console.log(`✅ Exported globe: ${outPath}`);
