import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/takeUntil';
import { Injectable } from '@angular/core';
import { Effect, Actions, toPayload } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';
import { of } from 'rxjs/observable/of';

import * as fromRoot from '../reducers';

import * as friendsActions from '../actions/friends';
import { FriendsService } from '../services/friends';
import { DiaryEntry } from '../models/diary-entry';

/**
 * Effects offer a way to isolate and easily test side-effects within your
 * application.
 * The `toPayload` helper function returns just
 * the payload of the currently dispatched action, useful in
 * instances where the current state is not necessary.
 *
 * Documentation on `toPayload` can be found here:
 * https://github.com/ngrx/effects/blob/master/docs/api.md#topayload
 *
 * If you are unfamiliar with the operators being used in these examples, please
 * check out the sources below:
 *
 * Official Docs: http://reactivex.io/rxjs/manual/overview.html#categories-of-operators
 * RxJS 5 Operators By Example: https://gist.github.com/btroncone/d6cf141d6f2c00dc6b35
 */

@Injectable()
export class FriendsEffects {
  @Effect()
  getAllLists$: Observable<Action> = this.actions$
    .ofType(friendsActions.GET_ALL_LISTS_ACTION)
    .mergeMap(() => from([
      new friendsActions.GetRejectedInvitesAction(),
      new friendsActions.GetFriendsAction(),
      new friendsActions.GetPendingInvitesAction(),
      new friendsActions.GetOutcomePendingInvitesAction(),
    ]));

  @Effect()
  add$: Observable<Action> = this.actions$
    .ofType(friendsActions.CREATE_FRIENDSHIP)
    .switchMap((action: any) => {
      return this.friendsService.sendInvite(action.payload)
        .map((data: any) => new friendsActions.CreateFriendshipSuccessAction())
        .catch(() => of(new friendsActions.CreateFriendshipFailureAction()));
    });

  @Effect()
  acceptInvite$: Observable<Action> = this.actions$
    .ofType(friendsActions.ACCEPT_INVITE)
    .switchMap((action: any) => {
      return this.friendsService.acceptInvite(action.payload)
        .mergeMap(() => from([
          new friendsActions.AcceptInviteSuccessAction(),
          new friendsActions.GetAllListsAction(),
        ]))
        .catch(() => of(new friendsActions.AcceptInviteFailureAction()));
    });

  @Effect()
  getFriends$: Observable<Action> = this.actions$
    .ofType(friendsActions.GET_FRIENDS)
    .switchMap(() => {
      return this.friendsService.getFriends()
        .map((data: any) => new friendsActions.GetFriendsSuccessAction(data))
        .catch(() => of(new friendsActions.GetFriendsFailureAction()));
    });

  @Effect()
  getFriendDiaryEntries: Observable<Action> = this.actions$
    .ofType(friendsActions.GET_FRIEND_DIARY_ENTRIES)
    .switchMap((action: any) => {
      return this.friendsService.getFriendEntries(action.payload)
        .map((diaryEntries: DiaryEntry[]) => new friendsActions.GetFriendDiaryEntriesSuccessAction(diaryEntries))
        .catch(() => of(new friendsActions.GetFriendDiaryEntriesSuccessAction(([]))));
    });

  @Effect()
  getPendingInvites$: Observable<Action> = this.actions$
    .ofType(friendsActions.GET_PENDING_INVITES)
    .withLatestFrom(this.store)
    .switchMap(([action, state]) => {
      const { email } = fromRoot.getUser(state);

      return this.friendsService.getPendingInvites(email)
        .map((data: any) => {
          return new friendsActions.GetPendingInvitesSuccessAction(data);
        })
        .catch((kek) => {
          return of(new friendsActions.GetPendingInvitesFailureAction(null));
        });
    });

  @Effect()
  getOutcomePendingInvites$: Observable<Action> = this.actions$
    .ofType(friendsActions.GET_OUTCOME_PENDING_INVITES)
    .switchMap(() => {
      return this.friendsService.getOutcomePendingInvites()
        .map((data: any) => new friendsActions.GetOutcomePendingInvitesSuccessAction(data))
        .catch(() => of(new friendsActions.GetOutcomePendingInvitesFailureAction(null)));
    });

  @Effect()
  getRejectedInvites$: Observable<Action> = this.actions$
    .ofType(friendsActions.GET_REJECTED_INVITES)
    .switchMap(() => {
      return this.friendsService.getRejectedInvites()
        .map((data: any) => {
          return new friendsActions.GetRejectedInvitesSuccessAction(data);
        })
        .catch(() => {
          return of(new friendsActions.GetRejectedInvitesFailureAction());
        });
    });

    constructor(
      private actions$: Actions,
      private friendsService: FriendsService,
      private store: Store<fromRoot.State>,
    ) { }
}
