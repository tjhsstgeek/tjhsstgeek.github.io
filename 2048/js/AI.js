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
	this.badloc = ai_badloc;
}

function ai_dup() {
	return new ai_grid(this.arr);
}

ai_grid.prototype.reset = function (other) {
	for (var a = 0; a < this.arr.length; a++) {
		this.arr[a] = other.arr[a];
	}
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

ai_grid.prototype.bruteforce_recurse = function (n) {
	if (n == 0) {
		/* Let something else handle the intricate details */
		return [16 - this.cost(), 0];
	}

	/* Total # of places that element could fall */
	var tot = 0;
	/* Total # of safe places */
	var safe = 0;
	/* What is the probability of losing in this situation */
	var prob_lose = 0;
	/* What is the total score */
	var score = 16;

	var tmp = this.dup();

	var loc = 0;
	var which = 0;

	var prev2_up = [null, null, null, null];
	var prev2_down = [null, null, null, null];
	var prev4_up = [null, null, null, null];
	var prev4_down = [null, null, null, null];
	for (var y = 0;y < 4;y++) {
		var prev2_left = null;
		var prev2_right = null;
		var prev4_left = null;
		var prev4_right = null;
		for (var x = 0;x < 4;x++) {
			if (this.get(y * 4 + x) != 0) {
				prev2_up[x] = prev2_down[x] = prev2_left = prev2_right = null;
				prev4_up[x] = prev4_down[x] = prev4_left = prev4_right = null;
				continue;
			}

			tot++;

			/* Easy access array */
			var prev2 = [prev2_up[x], prev2_right, prev2_down[x], prev2_left];
			var prev4 = [prev4_up[x], prev4_right, prev4_down[x], prev4_left];

			var prob_lose_2 = 1, prob_lose_4 = 1;
			var score_2 = 0, score_4 = 0;

			for (var dir = 0;dir < 4;dir++) {
				var c = prev2[dir];
				if (!c) {
					tmp.set(y * 4 + x, 2);
					if (tmp.move(dir)) {
						c = tmp.bruteforce_recurse(n - 1);
						prev2[dir] = c;
						tmp.reset(this);
					} else {
						/* No moves done, so grid unchanged */
					}
				}

				if (c && (c[1] < prob_lose_2 || (c[1] == prob_lose_2 && c[0] > score_2))) {
					prob_lose_2 = c[1];
					score_2 = c[0];
				}

				var c = prev4[dir];
				if (!c) {
					tmp.set(y * 4 + x, 4);
					if (tmp.move(dir)) {
						c = tmp.bruteforce_recurse(n - 1);
						prev4[dir] = c;
						tmp.reset(this);
					} else {
						/* No moves done, so grid unchanged */
					}
				}

				if (c && (c[1] < prob_lose_4 || (c[1] == prob_lose_4 && c[0] > score_4))) {
					prob_lose_4 = c[1];
					score_4 = c[0];
				}
			}

			//console.log(n, prob_lose_2, prob_lose_4, score_2, score_4);

			/* Reset the index in tmp */
			tmp.set(y * 4 + x, 0);

			if (prob_lose_2 > prob_lose_4 || (prob_lose_2 == prob_lose_4 && score_2 <= score_4)) {
				if (prob_lose_2 > prob_lose || (prob_lose_2 == prob_lose && score_2 < score)) {
					score = score_2;
					prob_lose = prob_lose_2;
					loc = y * 4 + x;
					which = 2;
				}
			} else {
				if (prob_lose_4 > prob_lose || (prob_lose_4 == prob_lose && score_4 < score)) {
					score = score_4;
					prob_lose = prob_lose_4;
					loc = y * 4 + x;
					which = 4;
				}
				//console.log("l", x, y, prob_lose_4, score_4);
			}

			prev2_up[x] = prev2[0];
			prev2_right = prev2[1];
			prev2_down[x] = prev2[2];
			prev2_left = prev2[3];

			prev4_up[x] = prev4[0];
			prev4_right = prev4[1];
			prev4_down[x] = prev4[2];
			prev4_left = prev4[3];
		}
	}

	//console.log(n, score, prob_lose, loc, which);

	return [score, prob_lose, loc, which];
}

function ai_badloc() {
	var n = this.bruteforce_recurse(3);
	console.log(n);
	return [n[2], n[3]];
}

/*function ai_badloc2() {
	var cost = 0;
	var loc = -1;
	var type = -1;

	var prev_x_arr = [false, false, false, false];
	var prev_y_arr = [false, false, false, false];

	for (j = 0;j < 16;j++) {
		if (this.get(j) != 0) {
			prev_x_arr[parseInt(j / 4)] = false;
			prev_y_arr[j % 4] = false;
			continue;
		}

		var prev_x = prev_y_arr[parseInt(j / 4)];
		var prev_y = prev_y_arr[j % 4];
		var prev = [prev_x, prev_y, prev_x, prev_y];

		this.set(j, 2);
		var local_cost1 = 0xffffffff;
		for (var i = 0;i < 4;i++) {
			if (prev[i])
				continue;

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
			if (prev[i])
				continue;

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

		prev_y_arr[parseInt(j / 4)] = true;
		prev_y_arr[j % 4] = true;
	}

	return [loc, type];
}*/
