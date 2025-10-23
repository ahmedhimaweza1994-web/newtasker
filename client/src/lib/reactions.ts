export interface GroupedReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; fullName: string }>;
}

export function groupReactions(reactions: any[]): GroupedReaction[] {
  const grouped = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: [],
      };
    }
    acc[reaction.emoji].count++;
    if (reaction.user) {
      acc[reaction.emoji].users.push({
        id: reaction.user.id,
        fullName: reaction.user.fullName,
      });
    }
    return acc;
  }, {} as Record<string, GroupedReaction>);

  return Object.values(grouped).sort((a, b) => b.count - a.count);
}
