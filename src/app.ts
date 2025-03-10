import express, { Request, Response } from 'express';
import cors from 'cors';
import h3 from 'h3-js';
import db from './db';

interface PolygonInfo {
  h3_index: string;
  level: number;
  gold: number;
  wood: number;
  ore: number;
  fromDB: boolean;
}

const app = express();
app.use(cors());
app.use(express.json());

// Функция генерации инфы о гексе
async function setInfoPolygon_10(h3Index: string): Promise<void> {
  const numbers = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));
  await db.query(
    'INSERT INTO polygons (h3_index, level, gold, wood, ore) VALUES ($1, $2, $3, $4, $5)',
    [h3Index, 10, ...numbers]
  );
}

// Функция получения инфы о гексе
async function getInfoPolygon_10(h3Index: string): Promise<PolygonInfo> {
  const result = await db.query(
    'SELECT * FROM polygons WHERE h3_index = $1',
    [h3Index]
  );
  
  if (result.rows.length === 0) {
    return {h3_index: h3Index, level: 10, gold: 0, wood: 0, ore: 0, fromDB: false };
  }
  const data =  result.rows[0];
  data.fromDB = true;

  return data;
}

// Роут получения инфы 10 гекса
app.get('/api/polygon/:id/info', async (req: Request, res: Response) => {
  try {
    const h3Index = req.params.id;
    let data = await getInfoPolygon_10(h3Index);

    if (!data.fromDB) {
      await setInfoPolygon_10(h3Index);
      data = await getInfoPolygon_10(h3Index);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

interface ResourceSummary {
  gold: number;
  wood: number;
  ore: number;
}

// Функция суммы дочерних гексов
async function sumChildResources(parentH3Index: string, targetLevel = 10): Promise<ResourceSummary> {
  const children = h3.cellToChildren(parentH3Index, targetLevel);
  
  const childrenResources = await Promise.all(
    children.map(child => getInfoPolygon_10(child))
  );
  
  return childrenResources.reduce((acc, { gold, wood, ore }) => ({
    gold: acc.gold + gold,
    wood: acc.wood + wood,
    ore: acc.ore + ore
  }), { gold: 0, wood: 0, ore: 0 });
}

// Роут получения инфы <10 гекса
app.get('/api/polygon/:level/:id/info', async (req: Request, res: Response) => {
  try {
    const h3Index = req.params.id;
    const data = await sumChildResources(h3Index);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});