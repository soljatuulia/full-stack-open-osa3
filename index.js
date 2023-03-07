require('dotenv').config();

const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

const Person = require('./models/person');

const errorHandler = (error, req, res, next) => {
	console.error(error.message);

	if (error.name === 'CastError') {
		return res.status(400).send({ error: 'malformatted id' });
	} else if (error.name === 'ValidationError') {
		return res.status(400).json({ error: error.message });
	}

	next(error);
};

const unknownEndpoint = (req, res) => {
	res.status(404).send({ error: 'unknown endpoint' });
};

//middlewaret
app.use(express.static('build'));
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] :response-time ms :data'));
app.use(cors());

morgan.token('data', (req) => {
	return JSON.stringify(req.body);
});


let persons = [
];

app.get('/info', (req, res, next) => {
	Person.find({})
		.then(persons => {
			res.send(
				`<p>Phonebook has info for ${persons.length} people.</p>
				<p>${new Date()}</p>`
			);
		})
		.catch((error) => next(error));
});

app.get('/api/persons', (req, res) => {
	Person.find({})
		.then(persons => {
			res.json(persons);
		});
});

app.get('/api/persons/:id', (req, res, next) => {
	Person.findById(req.params.id)
		.then(person => {
			if (person) {
				res.json(person);
			} else {
				res.status(404).end();
			}
		})
		.catch(error => next(error));
});

app.post('/api/persons', (req, res, next) => {
	const body = req.body;

	if (!body.name || !body.number) {
		return res.status(400).json({
			error: 'Name or number missing'
		});
	} else if (persons.filter(person => person.name === body.name).length > 0) {
		return res.status(400).json({
			error: 'Name must be unique'
		});
	}

	const person = new Person({
		name: body.name,
		number: body.number
	});

	person.save()
		.then(savedPerson => {
			res.json(savedPerson);
		})
		.catch(error => next(error));
});

app.put('/api/persons/:id', (req, res, next) => {
	const { name, number } = req.body;

	Person.findByIdAndUpdate(
		req.params.id,
		{ name, number },
		{ new: true, runValidators: true, context: 'query' }
	)
		.then(updatedPerson => {
			res.json(updatedPerson);
		})
		.catch(error => next(error));
});

app.delete('/api/persons/:id', (req, res, next) => {
	Person.findByIdAndRemove(req.params.id)
		.then(res => {
			res.status(204).end();
		})
		.catch(error => next(error));
});

app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});