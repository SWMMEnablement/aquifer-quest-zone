import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onClose: () => void; }

const ETCalculatorSuite = ({ onClose }: Props) => {
  const [tempC, setTempC] = useState(20);
  const [humidity, setHumidity] = useState(60);
  const [wind, setWind] = useState(2);
  const [solar, setSolar] = useState(20); // MJ/m²/day
  const [lat, setLat] = useState(35);

  // Thornthwaite
  const thornthwaite = useMemo(() => {
    if (tempC <= 0) return 0;
    const I = Math.pow(tempC / 5, 1.514) * 12;
    const a = 6.75e-7 * I * I * I - 7.71e-5 * I * I + 1.79e-2 * I + 0.49;
    return +(16 * Math.pow(10 * tempC / I, a) / 30).toFixed(2); // mm/day
  }, [tempC]);

  // Hargreaves
  const hargreaves = useMemo(() => {
    const Ra = solar * 0.8; // approximate
    return +(0.0023 * Ra * (tempC + 17.8) * Math.pow(12, 0.5)).toFixed(2);
  }, [tempC, solar]);

  // Priestley-Taylor
  const priestleyTaylor = useMemo(() => {
    const delta = 4098 * (0.6108 * Math.exp(17.27 * tempC / (tempC + 237.3))) / Math.pow(tempC + 237.3, 2);
    const gamma = 0.066;
    const Rn = solar * 0.75;
    return +(1.26 * delta / (delta + gamma) * Rn / 2.45).toFixed(2);
  }, [tempC, solar]);

  // Penman-Monteith (simplified)
  const penmanMonteith = useMemo(() => {
    const delta = 4098 * (0.6108 * Math.exp(17.27 * tempC / (tempC + 237.3))) / Math.pow(tempC + 237.3, 2);
    const gamma = 0.066;
    const es = 0.6108 * Math.exp(17.27 * tempC / (tempC + 237.3));
    const ea = es * humidity / 100;
    const Rn = solar * 0.75;
    return +((0.408 * delta * Rn + gamma * 900 / (tempC + 273) * wind * (es - ea)) / (delta + gamma * (1 + 0.34 * wind))).toFixed(2);
  }, [tempC, humidity, wind, solar]);

  // Blaney-Criddle
  const blaney = useMemo(() => {
    const p = 0.27 + 0.0078 * lat; // daylight hours fraction
    return +(p * (0.46 * tempC + 8.13)).toFixed(2);
  }, [tempC, lat]);

  const compData = [
    { method: "Penman-Monteith", ET: penmanMonteith },
    { method: "Priestley-Taylor", ET: priestleyTaylor },
    { method: "Hargreaves", ET: hargreaves },
    { method: "Blaney-Criddle", ET: blaney },
    { method: "Thornthwaite", ET: thornthwaite },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={onClose} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">ET Calculator Suite</h1>
      <p className="text-muted-foreground mb-6">Five evapotranspiration methods compared simultaneously.
        <a href="https://ponce.sdsu.edu/" target="_blank" rel="noopener noreferrer" className="text-primary ml-2 inline-flex items-center gap-1">Ponce Reference <ExternalLink className="w-3 h-3" /></a>
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-water">
          <CardHeader><CardTitle className="text-lg">Climate Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Temperature: {tempC}°C</Label><Slider min={0} max={45} step={1} value={[tempC]} onValueChange={([v]) => setTempC(v)} /></div>
            <div><Label>Humidity: {humidity}%</Label><Slider min={10} max={100} step={5} value={[humidity]} onValueChange={([v]) => setHumidity(v)} /></div>
            <div><Label>Wind: {wind} m/s</Label><Slider min={0.5} max={10} step={0.5} value={[wind]} onValueChange={([v]) => setWind(v)} /></div>
            <div><Label>Solar Radiation: {solar} MJ/m²/day</Label><Slider min={5} max={35} step={1} value={[solar]} onValueChange={([v]) => setSolar(v)} /></div>
            <div><Label>Latitude: {lat}°</Label><Slider min={0} max={60} step={1} value={[lat]} onValueChange={([v]) => setLat(v)} /></div>
          </CardContent>
        </Card>
        <Card className="card-water lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">ET Comparison (mm/day)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" label={{ value: "ET (mm/day)", position: "bottom", offset: -5 }} tick={{ fontSize: 10 }} />
                <YAxis dataKey="method" type="category" tick={{ fontSize: 9 }} width={120} />
                <Tooltip />
                <Bar dataKey="ET" fill="hsl(var(--earth-green))" name="ET₀" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">Penman-Monteith is the FAO-56 reference standard. Methods differ based on data requirements and climate assumptions.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ETCalculatorSuite;
