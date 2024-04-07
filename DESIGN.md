# High-Level Design

## Requirements

* User should be able to use the [bazz](https://github.com/lirantal/bazz) CLI tool to subscribe for *push notifications on a completed CLI operation.

* Subsequent uses on bazz CLI should not require the user to re-register for push notifications, and can re-use existing push subscription to notify on completed CLI operations.

## UI Mocks Reference

# Success Cases

![image](https://user-images.githubusercontent.com/316371/35168262-f31feaf6-fd60-11e7-9029-a2e072f09b53.png)


# Error Cases

![image](https://user-images.githubusercontent.com/316371/35168251-e76786f6-fd60-11e7-9917-8c2f7d8123bb.png)

## High-Level User Interaction

### Push notification flow

The following describes the push notification work flow an end user will follow from running the bazz CLI (excluding bazz cli internal flow) and up until a push notification is made to the remote client.

![bazz-sequence-diagram 2](https://user-images.githubusercontent.com/316371/35168363-5802fd46-fd61-11e7-81c2-53fea2685600.png)

### Bazz CLI flow for Sign-up and trigger notification

![bazz-cli-sequence-diagram](https://user-images.githubusercontent.com/316371/35168507-e0a02700-fd61-11e7-93cb-063569c6d082.png)


## AWS Architecture Reference

The backend service is completely deployed as a set of serverless function APIs deployed on AWS Lambda.

The frontend project is deployed on a CDN that provides the frontend assets.

![aws-architecture-reference](https://user-images.githubusercontent.com/316371/35167834-91078a82-fd5f-11e7-91a6-754ee6923be2.png)
