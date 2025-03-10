const express = require('express');
const cors = require('cors');
const h3 = require('h3-js');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

// генерация инфы о гексе
async function setInfoPolygon_10(h3Index) {
  const numbers = Array.from({length: 3}, () => Math.floor(Math.random() * 10));
  await db.query(
    'INSERT INTO polygons (h3_index, level, gold, wood, ore) VALUES ($1, $2, $3, $4, $5)',
    [h3Index, 10, ...numbers])
}

// получение инфы о гексе 10 уровня
async function getInfoPolygon_10(h3Index) {
  const result = await db.query(
    'SELECT * FROM polygons WHERE h3_index = $1', 
    [h3Index]
  );
  if (result.rows && result.rows.length === 0) {
    return { id: 0, h3_index: h3Index, level: 10, gold: 0, wood: 0, ore: 0 };
  }
  
  return result.rows[0];
}

// Роут получения инфы 10го гекса
app.get('/api/polygon/:id/info', async (req, res) => {
  try {
    
    // Получаем параметры
    const h3Index = req.params.id;

    // Отправляем в функцию получения данных
    let data = await getInfoPolygon_10(h3Index);

    // Если пусто генерим
    if (data.id == 0) {
      setInfoPolygon_10(h3Index);

      // Даем ответ
      data = await getInfoPolygon_10(h3Index);
    }

    // Даем ответ
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Суммирование дочерних гексов
async function sumChildResources(parentH3Index, targetLevel = 10) {

    // Получение дочерних гексов
    const children =  h3.cellToChildren(parentH3Index, targetLevel); // Надо думать ...

    // Параллельный запрос ресурсов
    const childrenResources = await Promise.all(
      children.map(child => getInfoPolygon_10(child))
    );
    
    // Суммирование результатов
    return childrenResources.reduce((acc, { gold, wood, ore }) => ({
      gold: acc.gold + gold,
      wood: acc.wood + wood,
      ore: acc.ore + ore
    }), { gold: 0, wood: 0, ore: 0 });
}

// Роут получения инфы <10го гекса
app.get('/api/polygon/:level/:id/info', async (req, res) => {
  try {
    
    // Получаем параметры
    const h3Index = req.params['id'];
    const level = req.params['level'];

    // Отправляем в функцию получения данных
    const data = await sumChildResources(h3Index, 10);

    // Даем ответ
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