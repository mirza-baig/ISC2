using Sitecore.Data.Items;
using System.Security.Cryptography;
using System.Text;

namespace ISC2.Foundation.GraphQL.Extensions
{
    public static class VotingTokenExtensions
    {
        public static string GenerateToken(string memberNumber, string VotingSharedKey, string votingHashSuite)
        {
            byte[] data = Encoding.Default.GetBytes(memberNumber + VotingSharedKey);
            HashAlgorithm hashAlgorithm = HashAlgorithm.Create(votingHashSuite);
            byte[] hashedDataBytes = hashAlgorithm.ComputeHash(data);
            StringBuilder sb = new StringBuilder();
            foreach (byte b in hashedDataBytes)
            {
                sb.Append(b.ToString("X2"));
            }
            return sb.ToString();
        }
    }
}