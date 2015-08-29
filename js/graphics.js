"use strict";

var tetris = tetris || {};

tetris.world = tetris.world || {};
tetris.world.board = tetris.world.board || {};
tetris.world.board.matrix = tetris.world.board.matrix || [];

tetris.world.preview = tetris.world.preview || {};
tetris.world.scoreboard = tetris.world.scoreboard || {};

tetris.graphics = tetris.graphics || {};


function Block(image, container) {
  this.image = image;
  
  if (container)
    this.container = container;
  else
    this.container = tetris.stage;
  
  this.x = 0;
  this.y = 0;
  this.visible = false;
}


Block.prototype.show = function() {
  this.container.addChild(this.image);
  this.visible = true;
};


Block.prototype.hide = function() {
  this.container.removeChild(this.image);
  this.visible = false;
};


Block.prototype.remove = function() {
  this.container.removeChild(this.image);
  
  this.image = null;
  this.container = null;
  this.x = null;
  this.y = null;
  this.visible = null;
};


Block.prototype.get_position = function() {
  return {
    x: this.x,
    y: this.y
  };
};


Block.prototype.set_position = function(x, y) {
  this.x = x;
  this.y = y;
  
  this.image.x = x;
  this.image.y = y;
};


function Tetrimino(config, owner) {
  var i, j, image, block;
  
  this.type = config.type;
  this.matrix = $.extend(true, [], config.matrix);
  this.matrix_size = config.size;
  this.x = 0;
  this.y = 0;
  this.row = 0;
  this.column = 0;
  this.visible = false;
  this.blocks = [];
  
  if (owner)
    this.owner = owner;
  else
    this.owner = tetris.stage;
  
  this.container = new createjs.Container();
  
  for (i = 0; i < this.matrix_size; i++) {
    for (j = 0; j < this.matrix_size; j++) {
      if (this.matrix[i][j] == 1) {
        image = new createjs.Bitmap(tetris.graphics.queue.getResult("block_red_1"));
        block = new Block(image, this.container);
        
        block.set_position(j * 24, i * 24);
        
        this.blocks.push(block);
      }
    }
  }
  
  tetris.stage.update();
}


Tetrimino.prototype.show = function() {
  var i, l;
  
  this.owner.addChild(this.container);
  this.visible = true;
  
  for (i = 0, l = this.blocks.length; i < l; i++)
    this.blocks[i].show();
  
  tetris.stage.update();
};


Tetrimino.prototype.hide = function() {
  var i, l;
  
  this.owner.removeChild(this.container);
  this.visible = false;
  
  for (i = 0, l = this.blocks.length; i < l; i++)
    this.blocks[i].hide();
  
  tetris.stage.update();
};


Tetrimino.prototype.remove = function() {
  var i, l;
  
  for (i = 0, l = this.blocks.length; i < l; i++)
    this.blocks[i].remove();
  
  this.owner.removeChild(this.container);
  
  this.type = null;
  this.matrix = null;
  this.matrix_size = null;
  this.x = null;
  this.y = null;
  this.row = null;
  this.column = null;
  this.visible = null;
  this.blocks = null;
  
  tetris.stage.update();
};


/* rotate_matrix():
 *   rotates the matrix either 90 degrees clockwise or counter-clockwise
 * 
 *   this is okay mathematically, but overall since all the rotations of
 *   the tetriminos are known ahead of time, i may cache them statically
 *   and just loop
 */
Tetrimino.prototype.rotate_matrix = function(clockwise) {
  var n = this.matrix_size;
  var d = Math.floor(n / 2);
  var x, y, temp;
  
  if (tetris.debug.math) {
    console.log("Tetrimino->rotate_matrix(" + (clockwise ? "clockwise" : "counter-clockwise") + "):");
    console.log("  Before matrix rotation (n=" + n + ", d=" + d + "):");
    log_matrix(this.matrix);
  }
  
  if (clockwise) {
    for (x = 0; x < d; x++) {
      for (y = 0; y < (n - d); y++) {
        temp                              = this.matrix[x][y];
        this.matrix[x][y]                 = this.matrix[n - 1 - y][x];
        this.matrix[n - 1 - y][x]         = this.matrix[n - 1 - x][n - 1 - y];
        this.matrix[n - 1 - x][n - 1 - y] = this.matrix[y][n - 1 - x];
        this.matrix[y][n - 1 - x]         = temp;
      }
    }
  } else {
    for (x = 0; x < d; x++) {
      for (y = 0; y < (n - d); y++) {
        temp                              = this.matrix[x][y];
        this.matrix[x][y]                 = this.matrix[y][n - 1 - x];
        this.matrix[y][n - 1 - x]         = this.matrix[n - 1 - x][n - 1 - y];
        this.matrix[n - 1 - x][n - 1 - y] = this.matrix[n - 1 - y][x];
        this.matrix[n - 1 - y][x]         = temp;
      }
    }
  }
  
  if (tetris.debug.math) {
    console.log("  After matrix rotation:");
    log_matrix(this.matrix);
  }
};


Tetrimino.prototype.can_rotate = function() {
  return this.check_collisions(ROTATE);
};


/* rotate():
 * 
 */
Tetrimino.prototype.rotate = function(clockwise) {
  var i, j, n;
  
  this.rotate_matrix(clockwise);
  
  if (this.can_rotate() != 0) {
    tetris.sound_play("woosh");
    this.rotate_matrix(!clockwise);
    return false;
  }

  n = 0;

  for (i = 0; i < this.matrix_size; i++) {
    for (j = 0; j < this.matrix_size; j++) {
      if (this.matrix[i][j] == 1) {
        this.blocks[n].set_position(j * 24, i * 24);
        n++;
      }
    }
  }
  
  tetris.stage.update();
};


Tetrimino.prototype.set_position = function(x, y) {
  this.x = x;
  this.y = y;
  
  this.container.x = x;
  this.container.y = y;
  
  tetris.stage.update();
};


Tetrimino.prototype.goto = function(row, column) {
  this.row = Math.max(-3, Math.min(19, row));
  this.column = Math.max(-3, Math.min(9, column));
  
  this.set_position(this.column * 24, this.row * 24);
  
  return true;
};


/* matrix_minize():
 *   returns a matrix that removes 0 pads
 * 
 *   assumes square matrix (n * n)
 */
Tetrimino.prototype.matrix_minimize = function(input) {
  var output = [];
  var offset_col_left, offset_col_right, offset_row_top, offset_row_bottom;
  var i, j, k, l, n, sum;
  
  offset_col_left = input[0].length + 1;
  offset_col_right = -1;
  
  /* not used in the same way as col_left/right */
  offset_row_top = 0;
  offset_row_bottom = 0;

  /* this acquires the matrix's left and right pads */
  for (i = 0, j = input.length; i < j; i++) {
    for (k = 0, l = input[i].length; k < l; k++) {
      if (input[i][k] == 1) {
        if (k < offset_col_left)
          offset_col_left = k;
        
        if (k > offset_col_right)
          offset_col_right = k;
      }
    }
  }
  
  if (tetris.debug.graphics) {
    console.log("  input matrix:");
    log_matrix(input);
  }
  
  /* assign the left/right clipped matrix to output.  also remember you need
   * the right offset to be negative to subtract from the end of the array
   */
  for (i = 0, j = input.length; i < j; i++)
    output.push(input[i].slice(offset_col_left, offset_col_right + 1));
  
  if (tetris.debug.graphics) {
    console.log("  output matrix (after left and right padding removed):");
    log_matrix(output);
  }
  
  n = 0;
  
  for (i = 0, j = input.length; i < l; i++) {
    sum = 0;
    
    for (k = 0, l = input[i].length; k < l; k++)
      sum += input[i][k];
    
    if (sum == 0)
      n++;
    else
      break;
  }

  offset_row_top = n;
  
  /* n equals number of rows that need splicing off the front */
  if (n >= 1)
    output.splice(0, n);
  
  if (tetris.debug.graphics) {
    console.log("  output matrix (after top padding removed):");
    log_matrix(output);
  }
  
  n = 0;

  /* handle bottom padding */
  for (i = input.length - 1, j = 0; i >= j; i--) {
    sum = 0;
    
    for (k = 0, l = input[i].length; k < l; k++)
      sum += input[i][k];
    
    if (sum == 0)
      n++;
    else
      break;
  }

  offset_row_bottom = n;
  
  /* we ended on a row with a 1, so don't splice that row, just the ones after it */
  if (n >= 1)
    output.splice(-n, n);
  
  if (tetris.debug.graphics) {
    console.log("  output matrix (after bottom padding removed):");
    log_matrix(output);
  }
  
  if (tetris.debug.graphics) {
    console.log("  Tetrimino->matrix_minize():");
    console.log("    offset_col_left: " + offset_col_left.toString());
    console.log("    offset_col_right: " + offset_col_right.toString());
    console.log("    offset_row_top: " + offset_row_top.toString());
    console.log("    offset_row_bottom: " + offset_row_bottom.toString());
  }

  /* 0 pads should be removed now, so return an object that contains the matrix
   * and associated offsets.  this is kind of a jackass way of doing it, but i
   * think it'll make future calculations a little easier
   */
  return {
    matrix: output,
    top: offset_row_top,
    bottom: offset_row_bottom,
    left: offset_col_left,
    right: offset_col_right,
    width: output[0].length,
    height: output.length
  };
};


/* matrix_sum():
 *   returns the summation of ONLY TWO matrices.  ie, simple matrix addition
 *   
 *   assumes both matrices have identical dimensions
 */
Tetrimino.prototype.matrix_sum = function(one, two) {
  var output = [];
  var i, j, k, l;
  
  for (i = 0, j = one.length; i < j; i++) {
    output.push([]);
    
    for (k = 0, l = one[i].length; k < l; k++)
      output[i].push(one[i][k] + two[i][k]);
  }
  
  return output;
};


/* collide():
 *   called whenever a tetrimino collides on the BOTTOM (downward motion).  this
 *   will in turn result in the tetrimino being added to the 
 * 
 */
Tetrimino.prototype.collide = function() {

};


/* check_collisions():
 *   check to see if the intended move would collide against something
 *   
 *   mm = minified matrix.  this is important because, for simplicity, we want
 *   to check for a simple summation, in conjunction with a simple DNE.
 *   if the validation matrix wasn't minified, we'd have to keep retardedly
 *   iterating, constantly checking shit we shouldnt have to care about, etc
 * 
 *   returns:
 *     0 - no collision, everything ok
 *     1 - we collided, but only left or right, which won't hurt us, we just can't move in that direction
 *     2 - we collided downwards, and now we're fucked
 */
Tetrimino.prototype.check_collisions = function(direction) {
  var result = 0;
  var against = [];
  var mm = [];
  var i, j, k, l, row, column, sum;
  
  mm = this.matrix_minimize(this.matrix);
  
  row = this.row + mm.top;
  column = this.column + mm.left;
  
  if (tetris.debug.graphics) {
    console.log("Minimized matrix:");
    log_matrix(mm.matrix);
  }
  
  if (direction == LEFT) {
    if ((column - 1) < 0) { /* would take us to the left of the board */
      if (tetris.debug.graphics)
        console.log("  Tetrimino->check_collisions(" + directions[direction] + "): collision with board detected");
      
      result = 1;
    } else { /* we're still inside the board's designated bounds */
      for (i = row, j = (row + mm.height); i < j; i++)
        against.push(tetris.world.board.matrix[i].slice(column - 1, column - 1 + mm.width));
      
      if (tetris.debug.graphics) {
        console.log("Comparison matrix:");
        log_matrix(against);
      }
      
      sum = this.matrix_sum(mm.matrix, against);
      
      for (i = 0, j = sum.length; i < j; i++) {
        for (k = 0, k = sum[i].length; k < l; k++) {
          if (sum[i][k] >= 2) {
            result = 1;
            break;
          }
        }
        
        if (result != 0)
          break;
      }
    }
  } else if (direction == RIGHT) {
    if ((column + 1 + mm.width) > tetris.world.board.matrix[0].length) { /* would take us to the right of the board */
      if (tetris.debug.graphics)
        console.log("  Tetrimino->check_collisions(" + directions[direction] + "): collision with board detected");
      
      result = 1;
    } else { /* we're still inside the board's designated bounds */
      for (i = row, j = (row + mm.height); i < j; i++)
        against.push(tetris.world.board.matrix[i].slice(column + 1, column + 1 + mm.width));
      
      if (tetris.debug.graphics) {
        console.log("Comparison matrix:");
        log_matrix(against);
      }
      
      sum = this.matrix_sum(mm.matrix, against);
      
      for (i = 0, j = sum.length; i < j; i++) {
        for (k = 0, k = sum[i].length; k < l; k++) {
          if (sum[i][k] >= 2) {
            result = 1;
            break;
          }
        }
        
        if (result != 0)
          break;
      }
    }
  } else if (direction == DOWN) {
    if ((row + 1 + mm.height) > tetris.world.board.matrix.length) { /* would take us below the board */
      if (tetris.debug.graphics)
        console.log("  Tetrimino->check_collisions(" + directions[direction] + "): collision with board detected");
      
      result = 2;
    } else { /* we're still inside the board's designated bounds */
      for (i = (row + 1), j = (row + 1 + mm.height); i < j; i++)
        against.push(tetris.world.board.matrix[i].slice(column, column + mm.width));
      
      if (tetris.debug.graphics) {
        console.log("Comparison matrix:");
        log_matrix(against);
      }
      
      sum = this.matrix_sum(mm.matrix, against);
      
      for (i = 0, j = sum.length; i < j; i++) {
        for (k = 0, k = sum[i].length; k < l; k++) {
          if (sum[i][k] >= 2) {
            result = 2;
            break;
          }
        }
        
        if (result != 0)
          break;
      }
    }
  } else if (direction == ROTATE) {
    if ((column < 0) || ((column + mm.width) > tetris.world.board.matrix[0].length) || ((row + mm.height) > tetris.world.board.matrix.length)) {
      if (tetris.debug.graphics)
        console.log("  Tetrimino->check_collisions(" + directions[direction] + "): collision with board detected");
      
      result = 1;
    } else {
      for (i = row, j = (row + mm.height); i < j; i++)
        against.push(tetris.world.board.matrix[i].slice(column, column + mm.width));
      
      if (tetris.debug.graphics) {
        console.log("Comparison matrix:");
        log_matrix(against);
      }
      
      sum = this.matrix_sum(mm.matrix, against);
      
      for (i = 0, j = sum.length; i < j; i++) {
        for (k = 0, k = sum[i].length; k < l; k++) {
          if (sum[i][k] >= 2) {
            result = 2;
            break;
          }
        }
        
        if (result != 0)
          break;
      }
    }
  } else { /* shit went haywire and we're trying a direction we shouldnt */
    if (tetris.debug.graphics)
      console.log("  Tetriminos->check_collisions(" + directions[direction] + "): unhandled direction");
    
    result = 1; /* this will keep us from moving anywhere, but not do anything else */
  }
  
  return result;
};


Tetrimino.prototype.can_move = function(direction) {
  var result;
  
  result = this.check_collisions(direction);
  
  if (result == 2) {
    if (tetris.debug.graphics)
      console.log("  Tetrimino->can_move(): collision detected");
  
    this.collide();
  }
  
  return result;
};


Tetrimino.prototype.move = function(direction) {
  if (tetris.debug.controls)
    console.log("  Tetrimino->move(" + directions[direction] + ")");
  
  if (this.can_move(direction) != 0) {
    tetris.sound_play("woosh");
    return false;
  }
  
  switch (direction) {
    case UP:
      this.goto(this.row - 1, this.column);
      break;
    case RIGHT:
      this.goto(this.row, this.column + 1);
      break;
    case DOWN:
      this.goto(this.row + 1, this.column);
      break;
    case LEFT:
      this.goto(this.row, this.column - 1);
      break;
    default:
      break;
  }
  
  tetris.stage.update();
};

tetris.world.board.rotate = function(clockwise) {
  if (!tetris.world.board.current || !tetris.world.board.current.visible)
    return false;
  
  tetris.world.board.current.rotate(clockwise);
};

tetris.world.board.move = function(direction) {
  if (!tetris.world.board.current || !tetris.world.board.current.visible)
    return false;
  
  tetris.world.board.current.move(direction);
};


tetris.world.preview.align = function() {
  var x, y;
  
  /* container defaults to upper left corner of lookahead region */
  tetris.world.preview.container.x = 432;
  tetris.world.preview.container.y = 192;
  
  if (tetris.world.preview.current) {
    switch (tetris.world.preview.current.type) {
      case 0:
        x = 48;
        y = 24;
        break;
      case 1:
        x = 36;
        y = 36;
        break;
      case 2:
        x = 36;
        y = 36;
        break;
      case 3:
        x = 36;
        y = 48;
        break;
      case 4:
        x = 36;
        y = 36;
        break;
      case 5:
        x = 24;
        y = 48;
        break;
      case 6:
        x = 36;
        y = 36;
        break;
      default:
        x = 0;
        y = 0;
        break;
    }
    
    tetris.world.preview.container.x += x;
    tetris.world.preview.container.y += y;
  }
};


tetris.build_world = function() {
  var matrix = [];
  var row, column, i, l, image, block;
  
  for (row = 0; row < 22; row++) {
    matrix.push([]);
    
    for (column = 0; column < 25; column++) {
      matrix[row][column] = 0; /* zero it out by default (probably should be the other way and be 1'd by default) */
      
      if ((column <= 5) || (row >= 20))
        matrix[row][column] = 1;
      
      if (column >= 16) {
        if (row <= 7) {
          if ((row <= 0) || (row >= 4))
            matrix[row][column] = 1;
          
          if ((column <= 16) || (column >= 24))
            matrix[row][column] = 1;
        } else if (row >= 14) {
          matrix[row][column] = 1;
        } else {
          if ((column <= 17) || (column >= 23))
            matrix[row][column] = 1;
        }
      }
    }
  }
/*
  if (tetris.debug.graphics) {
    var str = '';

    for (row = 0; row < 22; row++)
      str += (matrix[row].toString()).split(", ").join(" ") + "\r\n";

    console.log(str);
  }
*/
  if (tetris.debug.graphics)
    log_matrix(matrix);

  /* world.matrix refers to the background staging area */
  tetris.world.matrix = matrix;
  tetris.world.blocks = [];
  
  tetris.init_preview();
  tetris.init_scoreboard();
  
  /* world.board refers to the actual playing area */
  tetris.world.board.container = new createjs.Container();
  tetris.world.board.container.x = 6 * 24;
  tetris.stage.addChild(tetris.world.board.container);

  for (row = 0; row < 22; row++) {
    for (column = 0; column < 25; column++) {
      if (matrix[row][column] == 1) {
        image = new createjs.Bitmap(tetris.graphics.queue.getResult("block_green_1"));
        block = new Block(image);
        
        /*  */
        block.set_position(column * 24, row * 24);
        
        tetris.world.blocks.push(block);
      }
    }
  }
  
  for (i = 0, l = tetris.world.blocks.length; i < l; i++)
    tetris.world.blocks[i].show();
  
  tetris.stage.update();
};


tetris.init_preview = function() {
  tetris.world.preview.container = new createjs.Container();
  tetris.stage.addChild(tetris.world.preview.container);
  tetris.world.preview.align();
};


tetris.init_scoreboard = function() {
  tetris.world.scoreboard.container = new createjs.Container();
  
  tetris.world.scoreboard.container.x = 416;
  tetris.world.scoreboard.container.y = 46;

  tetris.world.scoreboard.score = new createjs.Text("Score: 000,000", "bold 20px Tahoma", "#80c080");
  tetris.world.scoreboard.score.textBaseline = "alphabetic";
  
  tetris.world.scoreboard.highscore = new createjs.Text("High: 000,000", "bold 14px Tahoma", "#80c080");
  tetris.world.scoreboard.highscore.textBaseline = "alphabetic";
  tetris.world.scoreboard.highscore.y = 20;
  
  tetris.world.scoreboard.level = new createjs.Text("Level: 0", "bold 14px Tahoma", "#80c080");
  tetris.world.scoreboard.level.textBaseline = "alphabetic";
  tetris.world.scoreboard.level.y = 40;
  
  tetris.world.scoreboard.container.addChild(tetris.world.scoreboard.score);
  tetris.world.scoreboard.container.addChild(tetris.world.scoreboard.highscore);
  tetris.world.scoreboard.container.addChild(tetris.world.scoreboard.level);
  
  tetris.stage.addChild(tetris.world.scoreboard.container);
};


tetris.generate_graphics_manifest = function() {
  var i, l;
  
  for (i = 0, l = graphics.length; i < l; i++)
    tetris.manifests.graphics.push({
      id: graphics[i],
      src: tetris.config.paths.graphics + graphics[i] + ".png"
    });
};


tetris.load_graphics = function() {
  tetris.graphics.queue = new createjs.LoadQueue();
  
  tetris.graphics.queue.addEventListener("error", tetris.graphics_load_error);
  tetris.graphics.queue.addEventListener("complete", tetris.graphics_load_complete);
  
  tetris.graphics.queue.loadManifest(tetris.manifests.graphics);
};


tetris.graphics_load_error = function(event) {
  $("#errors").append("" + event.toString());
};


tetris.graphics_load_complete = function(event) {
  $(".graphics_status").html("&check;").css("color", "#60ff60");
  
  tetris.stage = new createjs.Stage("tetris_canvas");
  
  tetris.build_world();
};