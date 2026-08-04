using GraphQL.Types;
using ISC2.Foundation.GraphQL.Extensions;
using ISC2.Foundation.GraphQL.Models;

namespace ISC2.Foundation.GraphQL.GraphTypes
{
    public class VotingTokenResultGraphType: ObjectGraphType<Voting>
    {
        public VotingTokenResultGraphType()
        {
            base.Name = "VotingToken";
            Field<NonNullGraphType<StringGraphType>>("memberNumber", resolve: context => context.Source.MemberNumber);
            Field<NonNullGraphType<StringGraphType>>("votingToken", resolve: context => VotingTokenExtensions.GenerateToken(context.Source.MemberNumber, context.Source.SharedKey, context.Source.VotingHashSuit));
            Field<NonNullGraphType<StringGraphType>>("redirectUrl", resolve: context => context.Source.RedirectUrl);
        }
    }
}