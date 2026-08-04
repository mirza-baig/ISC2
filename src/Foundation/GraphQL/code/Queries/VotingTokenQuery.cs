using GraphQL.Types;
using GraphQL;
using Sitecore.Data;
using Sitecore.Services.GraphQL.Content;
using Sitecore.Services.GraphQL.Schemas;
using System;
using ISC2.Foundation.GraphQL.Models;
using ISC2.Foundation.GraphQL.GraphTypes;

namespace ISC2.Foundation.GraphQL.Queries
{
    public class VotingTokenQuery :
      RootFieldType<VotingTokenResultGraphType, Voting>,
      IContentSchemaRootFieldType
    {
        public VotingTokenQuery()
          : base("VotingToken", "Allows to get voting token for member.")
        {
            QueryArguments queryArguments = new QueryArguments(Array.Empty<QueryArgument>());
            QueryArgument<NonNullGraphType<StringGraphType>> queryArgument1 = new QueryArgument<NonNullGraphType<StringGraphType>>();
            queryArgument1.Name = "path";
            queryArgument1.Description = "Path to the Voting type.";
            queryArguments.Add((QueryArgument)queryArgument1);
            QueryArgument<StringGraphType> queryArgument2 = new QueryArgument<StringGraphType>();
            queryArgument2.Name = "memberNumber";
            queryArgument2.Description = "Member number to get voting token.";
            queryArguments.Add((QueryArgument)queryArgument2);
            this.Arguments = queryArguments;
        }

        protected override Voting Resolve(ResolveFieldContext context)
        {
            string path = context.GetArgument("path", string.Empty);
            string memberNumber = context.GetArgument("memberNumber", string.Empty);
            Sitecore.Diagnostics.Log.Info("Fetch voting details for user memberid:" + memberNumber, this);
            if (string.IsNullOrEmpty(path) || string.IsNullOrEmpty(memberNumber))
            {

                Sitecore.Diagnostics.Log.Info("User Details MemberID:" + memberNumber + "|Path: " + path, this);
                return (Voting)null;
            }
            try
            {
                var votingItem = this.Database.GetItem(path);
                if (votingItem != null)
                {
                    Sitecore.Diagnostics.Log.Info("Voting redirect details for user memberid:" + memberNumber, this);
                    return new Voting
                    {
                        MemberNumber = memberNumber,
                        SharedKey = votingItem.Fields[Templates.VotingRedirector.SharedKeyFieldId]?.ToString(),
                        RedirectUrl = votingItem.Fields[Templates.VotingRedirector.RedirectUrlFieldId]?.ToString(),
                        VotingHashSuit = votingItem.Parent.Fields[Templates.VotingRedirector.VotingHashSuitFieldId]?.ToString()
                    };
                }
                else
                {
                    Sitecore.Diagnostics.Log.Info("Voting details not found for user memberid:" + memberNumber, this);
                    context.Errors.Add(new ExecutionError("Voting details not found."));
                    return (Voting)null;
                }
            }
            catch (Exception ex)
            {
                Sitecore.Diagnostics.Log.Error("Error while fetching Voting Redirector details for user memberid:" + memberNumber + "|Error: " + ex.Message, this);
                context.Errors.Add(new ExecutionError("Error while fetching Voting Redirector details:" + ex.Message));
                return (Voting)null;
            }
        }

        public Database Database { get; set; }
    }
}