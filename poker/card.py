import random

SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades']
RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
}

class Card:
    def __init__(self, rank, suit):
        if rank not in RANKS or suit not in SUITS:
            raise ValueError(f"Invalid card {rank} of {suit}")
        self.rank = rank
        self.suit = suit
        self.value = RANK_VALUES[rank]

    def __repr__(self):
        return f"{self.rank}{self.suit[0]}"
    
    def __eq__(self, other):
        if not isinstance(other, Card): return False
        return self.value == other.value and self.suit == other.suit
    
    def __hash__(self):
        return hash((self.rank, self.suit))
        
class Deck:
    def __init__(self):
        self.cards = [Card(rank, suit) for suit in SUITS for rank in RANKS]
        self.shuffle()
        
    def shuffle(self):
        random.shuffle(self.cards)
        
    def draw(self, n=1):
        if n > len(self.cards):
            raise ValueError("Not enough cards in deck")
        return [self.cards.pop() for _ in range(n)]
