const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const h3 = require('h3-js');
const app = express();
app.use(cors());
app.use(express.json());

// Настройка подключения к PostgreSQL
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '123',
  database: 'postgres',
  port: 5432,
});

// Проверка подключения при старте
pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err.stack));

// Роут для получения всех полигонов
app.get('/api/polygons', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM polygons');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// генерация инфы о гексе
async function setInfoPolygon_10(h3Index) {
    const numbers = [];
    for (let i = 0; i < 3; i++) {
        const randomNumber = Math.floor(Math.random() * 10);
        numbers.push(randomNumber);
    }
    // Дожидаемся завершения запроса на вставку
    await pool.query('INSERT INTO polygons (h3_index, level, gold, wood, ore) VALUES (\$1, \$2, \$3, \$4, \$5)', [h3Index, 10, numbers[0], numbers[1], numbers[2]]);
    // Теперь получаем данные
    const { rows } = await pool.query('SELECT * FROM polygons WHERE h3_index = \$1', [h3Index]);
    return rows[0];
}

// получение инфы о гексе 10 уровня
async function getInfoPolygon_10(h3Index) {
    const { rows } = await pool.query('SELECT * FROM polygons WHERE h3_index = \$1', [h3Index]);
    // Если пусто возвращаем нули
    if (rows.length == 0) {
        const zerorows = {
              id: 0,
              h3_index: h3Index,
              level: 10,
              gold: 0,
              wood: 0,
              ore: 0
        }
        return zerorows;
    }
    //console.log(rows);
    return rows[0];
}

// Роут 10:
app.get('/api/polygon/:id/info', async (req, res) => {
  try {

    // Получаем индекс
    const h3Index  = req.params['id'];

    // Отправляем в функцию получения данных
    const row = await getInfoPolygon_10(h3Index);
    //console.log(row);

    // Если пусто
    if (row['id'] == 0) {
        const row = await setInfoPolygon_10(h3Index)
        //console.log(row);
        res.json(row);
    }
    else{
        res.json(row);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
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

// Роут <10:
app.get('/api/polygon/:level/:id/info', async (req, res) => {
  try {
    
    // Получаем параметры
    const h3Index = req.params['id'];
    const level = req.params['level'];

    // Отправляем в функцию получения данных
    const rows = await sumChildResources(h3Index);
    //console.log(rows);

    // Даем ответ
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});