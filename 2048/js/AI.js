function ai_grid(arr) {
	this.arr = new Array();
	for (var a = 0;a < 16;a++) {
		this.arr[a] = arr[a];
	}

	this.dup = ai_dup;
	this.get = ai_get;
	this.set = ai_set;
	this.move = ai_move;
	this.cost = ai_cost;
	this.score = ai_score;
	this.max = ai_max;
	this.bruteforce = ai_bruteforce;
	this.badloc = ai_badloc;
}

function ai_dup() {
	return new ai_grid(this.arr);
}

function ai_get(loc) {
	return this.arr[loc];
}

function ai_set(loc, val) {
	this.arr[loc] = val;
}

function ai_move(dir) {
	// 0: up, 1: right, 2:down, 3: left
	/* step1 is for combining, step2 for iterating the rows/columns */
	var step1, step2, start;
	if (dir == 0) {
		step1 = 4;
		step2 = 1;
		start = 0;
	} else if (dir == 2) {
		step1 = -4;
		step2 = -1;
		start = 15;
	} else if (dir == 1) {
		step1 = -1;
		step2 = -4;
		start = 15;
	} else if (dir == 3) {
		step1 = 1;
		step2 = 4;
		start = 0;
	} else
		return false;

	var diff = 0;

	for (var j = 0;j < 4;j++) {
		var merged = false;
		var slot = 0;

		for (var k = 0;k < 4;k++) {
			var loc = start + step2 * j + step1 * k;
			var val = this.get(loc);

			/* Skip empty cells */
			if (!val)
				continue;

			if (!merged && slot) {
				/* We only look at shifted values */
				var loc_merge = start + step2 * j + step1 * (slot - 1);
				var val_merge = this.get(loc_merge);

				if (val == val_merge) {
					this.set(loc_merge, val * 2);
					this.set(loc, 0);
					merged = true;
					diff++;
					/* This node is gone, so skip shifting it */
					continue;
				}
			} else {
				merged = false;
			}

			if (slot == k) {
				slot++;
				continue;
			}

			var loc_to = start + step2 * j + step1 * slot;
			this.set(loc, 0);
			this.set(loc_to, val);
			slot++;
			diff++;
		}
	}

	return diff != 0;
}

function ai_cost() {
	/* How bad is this grid */
	var cnt = 0;
	for (var i = 0;i < 16;i++) {
		if (this.get(i) > 0)
			cnt++;
	}
	return cnt;
}

function ai_score() {
	/* How bad is this grid */
	var cnt = 0;
	for (var i = 0;i < 16;i++) {
		cnt += this.get(i);
	}
	return cnt;
}

function ai_max() {
	/* How bad is this grid */
	var cnt = 0;
	for (var i = 0;i < 16;i++) {
		var val = this.get(i);
		if (val > cnt)
			cnt = val;
	}
	return cnt;
}

function ai_bruteforce(n) {
	/* Search all possible choices within a reasonable limit */
	/* The best choice does not lose and has the lowest number of pieces */

	if (n == 0)
		return [this.score(), -1];

	var score = 0;
	var dir = -1;
	var bad = 1;

	for (var i = 0;i < 4;i++) {
		var tmp = this.dup();
		if (!tmp.move(i))
			continue;

		var dat = tmp.badloc();
		tmp.set(dat[0], dat[1]);
		var res = tmp.bruteforce(n - 1);
		if (res[0] > score) {
			score = res[0];
			dir = i;
		}
	}

	if (dir == -1)
		return [this.score(), -1];

	return [score, dir];
}

function ai_badloc() {
	var cost = 0;
	var loc = -1;
	var type = -1;

	for (j = 0;j < 16;j++) {
		if (this.get(j) != 0)
			continue;

		this.set(j, 2);
		var local_cost1 = 0xffffffff;
		for (var i = 0;i < 4;i++) {
			var tmp = this.dup();
			if (!tmp.move(i))
				continue;

			var t1 = tmp.cost();
			if (t1 < local_cost1)
				local_cost1 = t1;
		}

		this.set(j, 4);
		var local_cost2 = 0xffffffff;
		for (var i = 0;i < 4;i++) {
			var tmp = this.dup();
			if (!tmp.move(i))
				continue;

			var t2 = tmp.cost();
			if (t2 < local_cost2)
				local_cost2 = t2;
		}

		this.set(j, 0);

		if (local_cost1 > cost) {
			loc = j;
			type = 2;
			cost = local_cost1;
		}
		if (local_cost2 > cost) {
			loc = j;
			type = 4;
			cost = local_cost2;
		}
	}

	return [loc, type];
}
