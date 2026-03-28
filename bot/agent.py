import random
from poker.hand_evaluator import evaluate_hand

class BotAgent:
    def __init__(self, name="PokerBot"):
        self.name = name
        
    def decide_action(self, player, game):
        """
        player: The Player object representing the bot.
        game: The PokerGame instance.
        Returns: ('fold', 0), ('call', amount), or ('raise', amount)
        """
        highest_bet = max((p.current_bet for p in game.players if p.is_active), default=0)
        amount_to_call = highest_bet - player.current_bet
        
        if not player.hand:
            return 'fold', 0
            
        cards = player.hand + game.community_cards
        if len(cards) >= 5:
            score, _, _ = evaluate_hand(cards)
        else:
            score = 1 # High card default for pre-flop
            
        if score > 2:
            raise_amount = amount_to_call + game.big_blind
            if raise_amount > player.balance:
                return 'call', amount_to_call if amount_to_call <= player.balance else player.balance
            return 'raise', raise_amount
        elif score == 2:
            if amount_to_call > player.balance:
                return 'fold', 0
            return 'call', amount_to_call
        else:
            if amount_to_call > 0:
                if random.random() < 0.1 and amount_to_call <= player.balance:
                    return 'call', amount_to_call
                return 'fold', 0
            else:
                return 'call', 0
