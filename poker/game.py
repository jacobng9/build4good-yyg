from .card import Deck
from .hand_evaluator import evaluate_hand, hand_rank_to_string

class Player:
    def __init__(self, name, balance=1000):
        self.name = name
        self.balance = balance
        self.hand = []
        self.current_bet = 0
        self.is_active = True
        
    def fold(self):
        self.is_active = False

    def bet(self, amount):
        if amount > self.balance:
            amount = self.balance
        self.balance -= amount
        self.current_bet += amount
        return amount

    def receive_cards(self, cards):
        self.hand = cards

class PokerGame:
    def __init__(self, player_names, starting_balance=1000, big_blind=20):
        self.players = [Player(name, starting_balance) for name in player_names]
        self.deck = Deck()
        self.community_cards = []
        self.pot = 0
        self.big_blind = big_blind
        self.small_blind = big_blind // 2
        
        # Dealer position
        self.dealer_idx = 0
        self.current_player_idx = 0

    def start_hand(self):
        self.deck = Deck()
        self.community_cards = []
        self.pot = 0
        
        for p in self.players:
            p.hand = []
            p.current_bet = 0
            if p.balance > 0:
                p.is_active = True
                p.receive_cards(self.deck.draw(2))
            else:
                p.is_active = False
                
        # Simple Blinds Setup
        num_players = len(self.players)
        sb_idx = (self.dealer_idx + 1) % num_players
        bb_idx = (self.dealer_idx + 2) % num_players
        
        self.pot += self.players[sb_idx].bet(self.small_blind)
        self.pot += self.players[bb_idx].bet(self.big_blind)
        
        self.current_player_idx = (self.dealer_idx + 3) % num_players
        
    def deal_flop(self):
        self.community_cards.extend(self.deck.draw(3))
        
    def deal_turn(self):
        self.community_cards.extend(self.deck.draw(1))
        
    def deal_river(self):
        self.community_cards.extend(self.deck.draw(1))

    def evaluate_winner(self):
        active_players = [p for p in self.players if p.is_active]
        if len(active_players) == 0:
            return None, "No active players"
        if len(active_players) == 1:
            active_players[0].balance += self.pot
            return active_players[0], "Winner by default"
            
        best_player = None
        # Hand scores range 1-10
        best_score = -1 
        best_tie_breaker = None
        
        for player in active_players:
            cards = player.hand + self.community_cards
            score, best_hand, tie_breaker = evaluate_hand(cards)
            
            if score > best_score:
                best_score = score
                best_player = player
                best_tie_breaker = tie_breaker
            elif score == best_score:
                if best_tie_breaker is None or tie_breaker > best_tie_breaker:
                    best_player = player
                    best_tie_breaker = tie_breaker
                    
        best_player.balance += self.pot
        winning_hand_name = hand_rank_to_string(best_score)
        return best_player, winning_hand_name
