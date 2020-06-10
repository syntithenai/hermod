// A javascript-enhanced crossword puzzle [c] Jesse Weisbeck, MIT/GPL 
(function($) {
	$(function() {
		// provide crossword entries in an array of objects like the following example
		// Position refers to the numerical order of an entry. Each position can have 
		// two entries: an across entry and a down entry
		var puzzleData = [
			 	{
					clue: "What is the capital of Australia",
					answer: "canberra",
					position: 1,
					orientation: "across",
					startx: 1,
					starty: 1
				},
			 	{
					clue: "What is the capital of El Salvador",
					answer: "sansalvador",
					position: 3,
					orientation: "across",
					startx: 2,
					starty: 3
				},
				{
					clue: "What is the capital of Equador",
					answer: "quito",
					position: 5,
					orientation: "across",
					startx: 7,
					starty: 6
				},
				//{
					//clue: "What is the capital of Iraq",
					//answer: "baghdad",
					//position: 4,
					//orientation: "across",
					//startx: 1,
					//starty: 8
				//},
				//{
					//clue: "What is the capital of Portugal",
					//answer: "lisbon",
					//position: 5,
					//orientation: "across",
					//startx: 5,
					//starty: 10
				//},
				//{
					//clue: "What is the capital of Vietnam",
					//answer: "hanoi",
					//position: 6,
					//orientation: "across",	
					//startx: 1,
					//starty: 11
				//},
				{
					clue: "What is the capital of The Netherlands",
					answer: "amsterdam",
					position: 1,
					orientation: "down",
					startx: 2,
					starty: 1
				},
				//{
					//clue: "What is the capital of Thailand",
					//answer: "bangkok",
					//position: 2,
					//orientation: "down",
					//startx: 1,
					//starty: 4
				//},
				//{
					//clue: "What is the capital of Russia",
					//answer: "moscow",
					//position: 4,
					//orientation: "down",
					//startx: 10,
					//starty: 2
				//},
                //{
					//clue: "What is the capital of Timor",
					//answer: "dili",
					//position: 3,
					//orientation: "across",
					//startx: 5,
					//starty: 8
				//}

				
			] 
	
		$('#puzzle-wrapper').crossword(puzzleData);
		
	})
	
})(jQuery)
