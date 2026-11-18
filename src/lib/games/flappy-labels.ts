import { text, type Painter } from './types';

// Short lines become parallel vertical lines after rotation. At the font's
// native 8×12 size, even the four-line Bayes formula fits a 60px pillar.
export const formulas: Record<string, string> = {
	ANALISI: '∂u/∂t + (u·∇)u\n= −∇p + ν∇²u\n∇·u = 0',
	ALGEBRA: 'det(A − λI) = 0\nAv = λv\nA = QΛQ⁻¹',
	DEADLINE: 'θₜ₊₁ = θₜ − η·\n(1/n)Σᵢ ∇θℓ(\nfθ(xᵢ), yᵢ)',
	NaN: 'P(θ|D) =\nP(D|θ)P(θ) / Z\nZ = ∫ P(D|ϑ)·\nP(ϑ)dϑ'
};

export function drawGateLabels(
	painter: Painter,
	x: number,
	gap: number,
	height: number,
	name: string
) {
	const formula = formulas[name] ?? formulas.ANALISI;
	// Leave the top toolbar and score unobstructed.
	const top = { start: 96, length: Math.max(0, gap - 91 - 96) };
	const bottom = { start: gap + 91, length: height - gap - 91 };
	const [long, short] = top.length > bottom.length ? [top, bottom] : [bottom, top];
	const nameLength = [...name].length * 8;
	const formulaLength = Math.max(...formula.split('\n').map((line) => [...line].length)) * 8;
	let nameY = short.start + short.length / 2;
	let formulaY = long.start + long.length / 2;
	if (short.length < nameLength + 8) {
		// At extreme gap positions, keep both labels in the longer pillar.
		const start = long.start + (long.length - nameLength - formulaLength - 12) / 2;
		nameY = start + nameLength / 2;
		formulaY = start + nameLength + 12 + formulaLength / 2;
	}
	text(painter, name, x + 30, nameY, 12, '#fff9ed', Math.PI / 2);
	text(painter, formula, x + 30, formulaY, 12, '#fff9ed', Math.PI / 2);
}
