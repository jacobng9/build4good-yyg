from itertools import combinations
from collections import Counter

class HandRank:
    HIGH_CARD = 1
    PAIR = 2
    TWO_PAIR = 3
    THREE_OF_A_KIND = 4
    STRAIGHT = 5
    FLUSH = 6
    FULL_HOUSE = 7
    FOUR_OF_A_KIND = 8
    STRAIGHT_FLUSH = 9
    ROYAL_FLUSH = 10

def evaluate_hand(cards):
    """
    Evaluates a list of Card objects (5 to 7 cards).
    Returns a tuple: (score, best_hand, tie_breaker_values)
    """
    if len(cards) < 5:
        raise ValueError("Need at least 5 cards")
        
    best_score = -1
    best_hand = None
    best_tie_breakers = None
    
    for combo in combinations(cards, 5):
        score, tie_breakers = _evaluate_5_card_hand(combo)
        
        if score > best_score:
            best_score = score
            best_hand = combo
            best_tie_breakers = tie_breakers
        elif score == best_score:
            if best_tie_breakers is None or tie_breakers > best_tie_breakers:
                best_hand = combo
                best_tie_breakers = tie_breakers
                
    return best_score, best_hand, best_tie_breakers

def _evaluate_5_card_hand(hand):
    # Sort hand by value descending
    sorted_hand = sorted(hand, key=lambda c: c.value, reverse=True)
    values = [c.value for c in sorted_hand]
    suits = [c.suit for c in sorted_hand]
    
    is_flush = len(set(suits)) == 1
    
    value_counts = Counter(values)
    counts = sorted(value_counts.values(), reverse=True)
    
    # Check straight
    is_straight = False
    straight_values = []
    
    unique_values = sorted(set(values), reverse=True)
    if len(unique_values) == 5 and unique_values[0] - unique_values[4] == 4:
        is_straight = True
        straight_values = unique_values
    elif unique_values == [14, 5, 4, 3, 2]: # A-2-3-4-5 wheel
        is_straight = True
        straight_values = [5, 4, 3, 2, 1]
        
    if is_flush and is_straight:
        if straight_values == [14, 13, 12, 11, 10]:
            return HandRank.ROYAL_FLUSH, straight_values
        return HandRank.STRAIGHT_FLUSH, straight_values
        
    if counts == [4, 1]:
        quad_val = [v for v, c in value_counts.items() if c == 4][0]
        kicker = [v for v, c in value_counts.items() if c == 1][0]
        return HandRank.FOUR_OF_A_KIND, [quad_val, kicker]
        
    if counts == [3, 2]:
        trip_val = [v for v, c in value_counts.items() if c == 3][0]
        pair_val = [v for v, c in value_counts.items() if c == 2][0]
        return HandRank.FULL_HOUSE, [trip_val, pair_val]
        
    if is_flush:
        return HandRank.FLUSH, values
        
    if is_straight:
        return HandRank.STRAIGHT, straight_values
        
    if counts == [3, 1, 1]:
        trip_val = [v for v, c in value_counts.items() if c == 3][0]
        kickers = sorted([v for v, c in value_counts.items() if c == 1], reverse=True)
        return HandRank.THREE_OF_A_KIND, [trip_val] + kickers
        
    if counts == [2, 2, 1]:
        pairs = sorted([v for v, c in value_counts.items() if c == 2], reverse=True)
        kicker = [v for v, c in value_counts.items() if c == 1][0]
        return HandRank.TWO_PAIR, pairs + [kicker]
        
    if counts == [2, 1, 1, 1]:
        pair = [v for v, c in value_counts.items() if c == 2][0]
        kickers = sorted([v for v, c in value_counts.items() if c == 1], reverse=True)
        return HandRank.PAIR, [pair] + kickers
        
    return HandRank.HIGH_CARD, values

def hand_rank_to_string(rank_score):
    ranks = {
        10: "Royal Flush",
        9: "Straight Flush",
        8: "Four of a Kind",
        7: "Full House",
        6: "Flush",
        5: "Straight",
        4: "Three of a Kind",
        3: "Two Pair",
        2: "One Pair",
        1: "High Card"
    }
    return ranks.get(rank_score, "Unknown")
