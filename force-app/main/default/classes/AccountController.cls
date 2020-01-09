public with sharing class AccountController {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountList() {
        return [
            SELECT Id, Name, Type, Industry
            FROM Account
            Order By CreatedDate DESC LIMIT 10
        ];
    }
}
